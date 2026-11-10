import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {constants} from 'node:fs'
import {copyFile, mkdtemp, mkdir, rm, writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import test from 'node:test'

const base = process.env.NEWS_TEST_BASE_URL ?? 'http://localhost:4321'
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const output = process.env.NEWS_REVIEW_DIR ?? join(tmpdir(), 'nepali-news-review')

test('News hub responsive SSR presentation, navigation and controlled missing-content states', async (t) => {
  assert.ok(process.env.BROWSER_EXECUTABLE, 'Set BROWSER_EXECUTABLE to Chromium')
  const reviewRoute = new URL('../../src/pages/dev/news-hub-test.astro', import.meta.url)
  await copyFile(new URL('./review-route.astro.txt', import.meta.url), reviewRoute, constants.COPYFILE_EXCL)
  t.after(() => rm(reviewRoute))
  assert.equal((await fetch(`${base}/ne/news/`)).status, 200)
  await mkdir(output, {recursive: true})
  const profile = await mkdtemp(join(tmpdir(), 'news-browser-'))
  const browser = spawn(process.env.BROWSER_EXECUTABLE, [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
    '--remote-allow-origins=*', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
  ], {stdio: ['ignore', 'ignore', 'pipe']})
  let stderr = ''
  browser.stderr.on('data', (data) => {stderr += data})
  let socket
  try {
    let port
    for (let attempt = 0; attempt < 150 && !port; attempt++) {
      port = stderr.match(/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//)?.[1]
      if (!port) await sleep(100)
    }
    assert.ok(port, stderr.slice(-1000))
    const target = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, {method: 'PUT'})).json()
    socket = new WebSocket(target.webSocketDebuggerUrl)
    await new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve, {once: true})
      socket.addEventListener('error', reject, {once: true})
    })
    let sequence = 0
    const pending = new Map()
    const errors = []
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data)
      if (message.id) {
        const request = pending.get(message.id)
        if (request) {
          pending.delete(message.id)
          message.error ? request.reject(new Error(message.error.message)) : request.resolve(message.result)
        }
      }
      if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text)
    })
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++sequence
      pending.set(id, {resolve, reject})
      socket.send(JSON.stringify({id, method, params}))
    })
    const evaluate = async (expression) => {
      const result = await send('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true})
      if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails))
      return result.result.value
    }
    const wait = async (expression) => {
      for (let attempt = 0; attempt < 150; attempt++) {
        try {
          if (await evaluate(expression)) return
        } catch (error) {
          if (!/Inspected target navigated|Execution context was destroyed|Cannot find context/.test(error.message)) throw error
        }
        await sleep(100)
      }
      throw new Error(`Timed out: ${expression}`)
    }
    const navigate = async (path) => {
      await evaluate('window.__previousNewsDocument = true')
      await send('Page.navigate', {url: `${base}${path}`})
      await wait(`!window.__previousNewsDocument && document.readyState === 'complete' && document.querySelector('.newspaper')`)
      await evaluate('document.fonts.ready')
      await evaluate("scrollTo({top:0,behavior:'instant'})")
    }
    const screenshot = async (name, selector) => {
      if (selector) await evaluate(`document.querySelector(${JSON.stringify(selector)}).scrollIntoView({block:'start',behavior:'instant'})`)
      await sleep(100)
      await wait(`[...document.querySelectorAll('.newspaper img')].filter(img=>{const r=img.getBoundingClientRect();return r.bottom>0 && r.top<innerHeight}).every(img=>img.complete)`)
      assert.deepEqual(await evaluate(`[...document.querySelectorAll('.newspaper img')].filter(img=>{const r=img.getBoundingClientRect();return r.bottom>0 && r.top<innerHeight && !img.naturalWidth}).map(img=>img.src)`), [], name)
      const image = await send('Page.captureScreenshot', {format: 'png'})
      await writeFile(join(output, `${name}.png`), Buffer.from(image.data, 'base64'))
    }
    const metrics = () => evaluate(`(() => {
      const page = document.querySelector('.newspaper');
      const headings = [...page.querySelectorAll('h1,h2,h3')];
      return {
        overflow: document.documentElement.scrollWidth > innerWidth,
        h1: document.querySelectorAll('h1').length,
        clipped: headings.filter(el => ['hidden','clip'].includes(getComputedStyle(el).overflowY) && el.scrollHeight > el.clientHeight + 1).map(el=>el.textContent),
        nestedLinks: page.querySelectorAll('a a').length,
        latest: page.querySelectorAll('#latest-news + ol > li').length,
        categories: page.querySelectorAll('.masthead nav a').length,
        legacyOption: [...page.querySelectorAll('.masthead nav a')].some(a=>a.href.includes('employment-economy')),
        mainCount: document.querySelectorAll('main').length,
        brokenImages: [...page.querySelectorAll('img')].filter(img=>img.complete && !img.naturalWidth).map(img=>img.src)
      }
    })()`)
    const check = async () => {
      const result = await metrics()
      assert.equal(result.overflow, false, JSON.stringify(result))
      assert.equal(result.h1, 1)
      assert.deepEqual(result.clipped, [])
      assert.equal(result.nestedLinks, 0)
      assert.equal(result.mainCount, 1)
      assert.equal(result.categories, 11)
      assert.equal(result.legacyOption, false)
      assert.deepEqual(result.brokenImages, [])
    }
    await send('Page.enable')
    await send('Runtime.enable')

    let frontPageSelection
    const categorySections = `section[aria-labelledby^="section-"]`
    const selection = () => evaluate(`({
      stories: [...document.querySelectorAll('.story > a')].map(a=>a.pathname),
      guides: [...document.querySelectorAll('#newest-guides + ul a')].map(a=>a.pathname)
    })`)
    const checkCategoryNavigation = async (width) => {
      const nav = await evaluate(`(() => {
        const links = [...document.querySelectorAll('.masthead nav a')];
        return {
          rows: new Set(links.map(a=>Math.round(a.getBoundingClientRect().top))).size,
          nowrap: links.every(a=>getComputedStyle(a).whiteSpace === 'nowrap'),
          scrollable: getComputedStyle(document.querySelector('.masthead nav')).overflowX === 'auto',
          order: links.map(a=>a.getAttribute('href'))
        }
      })()`)
      assert.equal(nav.rows, width >= 1280 ? 2 : 1)
      assert.equal(nav.nowrap, true)
      assert.equal(nav.scrollable, true)
      assert.equal(new Set(nav.order).size, 11)
    }
    const checkGuides = async (width) => {
      const boxes = await evaluate(`[...document.querySelectorAll('#newest-guides + ul li')].map(li=>{const r=li.getBoundingClientRect();return {x:r.x,y:r.y}})`)
      assert.equal(boxes.length, 6)
      if (width < 768) {
        assert.equal(new Set(boxes.map(({x}) => x)).size, 1)
        assert.ok(boxes.every((box, i) => i === 0 || box.y > boxes[i - 1].y))
      } else {
        assert.equal(new Set(boxes.slice(0, 3).map(({x}) => x)).size, 1)
        assert.equal(new Set(boxes.slice(3).map(({x}) => x)).size, 1)
        assert.ok(boxes[3].x > boxes[0].x)
        assert.equal(boxes[0].y, boxes[3].y)
        assert.ok(boxes[0].y < boxes[1].y && boxes[1].y < boxes[2].y)
        assert.ok(boxes[3].y < boxes[4].y && boxes[4].y < boxes[5].y)
      }
    }
    for (const width of [390, 768, 1440]) {
      await t.test(`published Nepali front page at ${width}px`, async () => {
        await send('Emulation.setDeviceMetricsOverride', {width, height: 1100, deviceScaleFactor: 1, mobile: width < 500})
        await navigate('/ne/news/')
        await check()
        assert.equal((await metrics()).latest, 6)
        await checkGuides(width)
        await checkCategoryNavigation(width)
        const currentSelection = await selection()
        if (frontPageSelection) assert.deepEqual(currentSelection, frontPageSelection, 'identical story and Guide IDs at every viewport')
        else frontPageSelection = currentSelection
        assert.equal(await evaluate(`document.querySelectorAll('#latest-news + ol .summary').length`), 0)
        const ids = await evaluate(`[...document.querySelectorAll('.story > a')].map(a=>a.pathname)`)
        assert.equal(new Set(ids).size, ids.length)
        console.log('News layout', width, await evaluate(`JSON.stringify({height:document.querySelector('.newspaper').offsetHeight, stories:document.querySelectorAll('.story').length, categories:document.querySelectorAll('[id^="section-"]').length})`))
        assert.ok(await evaluate(`document.querySelector('.lead-package').getBoundingClientRect().top < ${width === 390 ? 500 : 600}`))
        if (width === 1440) {
          assert.equal(await evaluate(`getComputedStyle(document.querySelector('#latest-news + ol')).gridTemplateColumns.split(' ').length`), 3)
          assert.equal(await evaluate(`new Set([...document.querySelectorAll('#latest-news + ol > li')].map(li=>li.getBoundingClientRect().top)).size`), 2)
          assert.ok(await evaluate(`document.querySelector('.latest img').getBoundingClientRect().width > 200`))
          assert.ok(await evaluate(`document.querySelector('.secondary img').getBoundingClientRect().width > 200`))
          const ratio = await evaluate(`(() => {const a=document.querySelector('.lead-package > .story').getBoundingClientRect();const b=document.querySelector('.secondary').getBoundingClientRect();return a.width/b.width})()`)
          assert.ok(ratio > 1.8 && ratio < 2.2)
          const fullSections = await evaluate(`[...document.querySelectorAll('${categorySections}')].filter(s=>s.querySelectorAll('.story').length === 5).map(s=>{
            const rows = [...s.querySelectorAll('.supporting-row')].map(el=>el.getBoundingClientRect());
            return {count:rows.length, sameColumn:rows.every(r=>r.x===rows[0].x),
              stacked:rows.every((r,i)=>i===0||r.top>=rows[i-1].bottom),
              thumbnails:[...s.querySelectorAll('.support img')].map(img=>img.getBoundingClientRect().width),
              summaries:s.querySelectorAll('.support .summary').length,
              divided:[...s.querySelectorAll('.supporting-row')].slice(1).every(row=>parseFloat(getComputedStyle(row).borderTopWidth)===1),
              naturalGaps:rows.every((r,i)=>i===0||Math.abs(r.top-rows[i-1].bottom-parseFloat(getComputedStyle(s.querySelector('.supporting')).rowGap))<1),
              alignment:getComputedStyle(s.querySelector('.supporting')).alignContent
            }
          })`)
          assert.ok(fullSections.length > 0)
          for (const section of fullSections) {
            assert.equal(section.count, 4)
            assert.equal(section.sameColumn, true)
            assert.equal(section.stacked, true)
            assert.equal(section.divided, true)
            assert.equal(section.summaries, 0)
            assert.equal(section.naturalGaps, true)
            assert.equal(section.alignment, 'start')
            assert.ok(section.thumbnails.every(width => width >= 150 && width <= 170))
          }
        }
        await screenshot(`news-${width}`)
        await screenshot(`latest-${width}`, '#latest-news')
        await screenshot(`category-${width}`, '[id^="section-"]')
        await screenshot(`two-story-${width}`, '#section-economy-personal-finance')
        await screenshot(`guides-${width}`, 'section:has(#newest-guides)')
      })
      await t.test(`published archive at ${width}px`, async () => {
        await navigate('/ne/news/page/2/')
        await check()
        assert.equal(await evaluate(`document.querySelector('.lead-package')`), null)
        assert.equal(await evaluate(`document.querySelectorAll('.story.archive').length`), 12)
        const current = await evaluate(`document.querySelector('nav[aria-label="समाचारका पृष्ठहरू"] [aria-current="page"]').textContent.trim()`)
        assert.ok(current.includes('2'))
        await screenshot(`archive-${width}`)
      })
    }

    await t.test('shareable filtered count, category reset, browser history and canonical', async () => {
      await navigate('/ne/news/?category=current-affairs')
      await check()
      assert.equal(await evaluate(`document.querySelector('.masthead [aria-current]').textContent`), 'समसामयिक विषय')
      assert.ok(await evaluate(`document.querySelector('link[rel="canonical"]').href.endsWith('/ne/news/?category=current-affairs')`))
      assert.ok(await evaluate(`document.querySelector('meta[name=robots]').content.includes('noindex')`))
      assert.ok(await evaluate(`document.querySelector('link[rel="next"]').href.endsWith('/ne/news/page/2/?category=current-affairs')`))
      await evaluate(`setTimeout(() => document.querySelector('nav[aria-label="समाचारका पृष्ठहरू"] a[rel="next"]').click(), 0)`)
      await wait(`location.pathname.includes('/page/2/') && document.readyState === 'complete' && document.querySelector('.newspaper')`)
      assert.equal(await evaluate('location.search'), '?category=current-affairs')
      assert.ok(await evaluate(`document.querySelector('link[rel="canonical"]').href.endsWith('/ne/news/page/2/?category=current-affairs')`))
      assert.ok(await evaluate(`document.querySelector('link[rel="prev"]').href.endsWith('/ne/news/?category=current-affairs')`))
      await evaluate(`setTimeout(() => document.querySelector('.masthead a[href*="category=health-welfare"]').click(), 0)`)
      await wait(`location.pathname === '/ne/news/' && location.search === '?category=health-welfare' && document.querySelector('h1')?.textContent === 'स्वास्थ्य र कल्याण'`)
      await evaluate('setTimeout(() => history.back(), 0)')
      await wait(`location.pathname.includes('/page/2/') && document.querySelector('h1')?.textContent === 'समसामयिक विषय'`)
      await evaluate('setTimeout(() => history.forward(), 0)')
      await wait(`location.search === '?category=health-welfare' && document.querySelector('h1')?.textContent === 'स्वास्थ्य र कल्याण'`)
    })

    await t.test('archive entry and later archive pages retain the existing windows and metadata', async () => {
      await navigate('/ne/news/?archive=1')
      await check()
      assert.equal(await evaluate(`document.querySelectorAll('.story.archive').length`), 9)
      assert.equal(await evaluate(`document.querySelector('.lead-package')`), null)
      assert.ok(await evaluate(`document.querySelector('link[rel="canonical"]').href.endsWith('/ne/news/')`))
      assert.ok(await evaluate(`document.querySelector('link[rel="next"]').href.endsWith('/ne/news/page/2/')`))
      await navigate('/ne/news/page/3/')
      await check()
      assert.equal(await evaluate(`document.querySelectorAll('.story.archive').length`), 12)
      assert.ok(await evaluate(`document.querySelector('link[rel="canonical"]').href.endsWith('/ne/news/page/3/')`))
      assert.ok(await evaluate(`document.querySelector('link[rel="prev"]').href.endsWith('/ne/news/page/2/')`))
      assert.ok(await evaluate(`document.querySelector('link[rel="next"]').href.endsWith('/ne/news/page/4/')`))
      assert.equal(await evaluate(`document.querySelector('meta[name=robots]')`), null)
    })

    await t.test('Norwegian News retains language and disabled Guidance gate', async () => {
      await navigate('/nb/news/')
      await check()
      await checkCategoryNavigation(1440)
      assert.equal(await evaluate('document.documentElement.lang'), 'nb')
      assert.equal(await evaluate(`document.querySelector('#newest-guides')`), null)
      assert.equal(await evaluate(`document.querySelector('h1').textContent`), 'Nyheter')
      await screenshot('norwegian-1440')
      await navigate('/nb/news/?category=sports')
      await check()
      assert.equal(await evaluate(`document.querySelectorAll('.story').length`), 0)
      assert.match(await evaluate(`document.querySelector('.empty').textContent`), /kategorien/)
    })

    await t.test('Important Now, missing images, four-section cap and pagination fixtures', async () => {
      await send('Emulation.setDeviceMetricsOverride', {width: 390, height: 1100, deviceScaleFactor: 1, mobile: true})
      await navigate('/dev/news-hub-test/')
      await check()
      assert.ok(await evaluate(`document.querySelector('aside[aria-label="अहिले महत्त्वपूर्ण"]').getBoundingClientRect().top < document.querySelector('.lead-package').getBoundingClientRect().top`))
      assert.equal(await evaluate(`document.querySelectorAll('[id^="section-"]').length`), 4)
      assert.equal(await evaluate(`document.querySelector('meta[name="robots"]').content`), 'noindex, nofollow')
      await screenshot('important-fixture-390')
      await navigate('/dev/news-hub-test/?image-free')
      await check()
      assert.equal(await evaluate(`document.querySelectorAll('.newspaper img').length`), 0)
      assert.equal(await evaluate(`document.querySelectorAll('.story').length`), 23)
      await screenshot('image-free-fixture-390')
      await navigate('/dev/news-hub-test/?overlap')
      await check()
      assert.equal(await evaluate(`document.querySelector('aside a').getAttribute('href')`), '#news-lead')
      assert.equal(await evaluate(`document.querySelectorAll('a[href="/ne/news/review-recent-0/"]').length`), 1)
      await navigate('/dev/news-hub-test/?archive')
      await check()
      assert.match(await evaluate(`document.querySelector('.mobile[aria-current]').textContent`), /8 \/ 15/)
      assert.notEqual(await evaluate(`getComputedStyle(document.querySelector('nav > .mobile')).display`), 'none')
      await screenshot('pagination-fixture-390', 'nav[aria-label="समाचारका पृष्ठहरू"]')
      await send('Emulation.setDeviceMetricsOverride', {width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false})
      assert.equal(await evaluate(`getComputedStyle(document.querySelector('nav > .mobile')).display`), 'none')
      await screenshot('archive-range-fixture-1440', 'nav[aria-label="समाचारका पृष्ठहरू"]')
      const range = await evaluate(`[...document.querySelectorAll('nav[aria-label="समाचारका पृष्ठहरू"] li')].map(el=>el.textContent.trim())`)
      assert.deepEqual(range, ['1', '…', '6', '7', '8', '9', '10', '…', '15'])
      await navigate('/dev/news-hub-test/?invalid-image')
      await check()
      assert.equal(await evaluate(`document.querySelector('.story.lead img')`), null)
      assert.ok(await evaluate(`document.querySelector('.story.lead h2').textContent.length > 0`))
      await navigate('/dev/news-hub-test/?small-image')
      await check()
      assert.ok(await evaluate(`document.querySelector('.story.lead img').getBoundingClientRect().width <= 100`))
      assert.ok(await evaluate(`[...document.querySelector('.story.lead img').srcset.matchAll(/ (\\d+)w/g)].every(match=>Number(match[1])<=100)`))
    })

    await t.test('all category fallback layouts preserve selected IDs at mobile, tablet and desktop', async () => {
      let fixtureSelection
      for (const width of [390, 768, 1440]) {
        await send('Emulation.setDeviceMetricsOverride', {width, height: 1100, deviceScaleFactor: 1, mobile: width < 500})
        await navigate('/dev/news-hub-test/')
        await check()
        await checkGuides(width)
        const current = await selection()
        if (fixtureSelection) assert.deepEqual(current, fixtureSelection)
        else fixtureSelection = current
        const sections = await evaluate(`[...document.querySelectorAll('${categorySections}')].map(s=>({
          count:s.querySelectorAll('.story').length,
          supporting:s.querySelectorAll('.supporting .story').length,
          paired:s.querySelectorAll('.paired').length,
          emptyRows:[...s.querySelectorAll('.supporting-row')].some(row=>!row.querySelector('.story')),
          titles:[...s.querySelectorAll('.story > a')].map(a=>a.pathname)
        }))`)
        assert.deepEqual(sections.map(({count}) => count), [5, 4, 3, 2])
        assert.deepEqual(sections.map(({supporting}) => supporting), [4, 3, 2, 0])
        assert.equal(sections.at(-1).paired, 1)
        assert.ok(sections.every(({emptyRows}) => !emptyRows))
        assert.equal(new Set(current.stories).size, current.stories.length)
        assert.equal(await evaluate(`document.querySelectorAll('${categorySections} .support .summary').length`), 0)
        await screenshot(`four-story-fixture-${width}`, '#section-immigration-integration')
        await screenshot(`three-story-fixture-${width}`, '#section-work-employment')
      }
    })

    await t.test('intermediate widths retain readable structure, touch targets and keyboard category access', async () => {
      for (const width of [360, 430, 1024, 1280, 1920]) {
        await send('Emulation.setDeviceMetricsOverride', {width, height: 1100, deviceScaleFactor: 1, mobile: width < 500})
        await navigate('/ne/news/')
        await check()
        assert.ok(await evaluate(`[...document.querySelectorAll('.masthead nav a')].every(a=>a.getBoundingClientRect().height >= 44)`))
        await checkCategoryNavigation(width)
        await evaluate(`[...document.querySelectorAll('.masthead nav a')].at(-1).focus()`)
        await sleep(200)
        assert.ok(await evaluate(`[...document.querySelectorAll('.masthead nav a')].at(-1).getBoundingClientRect().right <= document.querySelector('.masthead nav').getBoundingClientRect().right + 1`))
      }
    })

    await t.test('server navigation requires no JavaScript and invalid inputs fail safely', async () => {
      await send('Emulation.setScriptExecutionDisabled', {value: true})
      await navigate('/ne/news/?category=current-affairs')
      await check()
      assert.equal(await evaluate(`document.querySelectorAll('.story').length`), 12)
      await send('Emulation.setScriptExecutionDisabled', {value: false})
      for (const category of ['invalid', 'employment-economy']) {
        const response = await fetch(`${base}/ne/news/?category=${category}`, {redirect: 'manual'})
        assert.equal(response.status, 302)
        assert.equal(response.headers.get('location'), '/ne/news/')
      }
      assert.equal((await fetch(`${base}/ne/news/page/1/`, {redirect: 'manual'})).status, 301)
      for (const path of ['/ne/news/page/999999/', '/ne/news/page/0/', '/ne/news/page/2x/', '/en/news/']) {
        assert.equal((await fetch(`${base}${path}`)).status, 404, path)
      }
    })
    assert.deepEqual(errors, [])
    console.log(`News review screenshots: ${output}`)
  } finally {
    socket?.close()
    browser.kill('SIGTERM')
    await new Promise((resolve) => browser.once('exit', resolve))
    await rm(profile, {recursive: true, force: true})
  }
})
