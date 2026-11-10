import assert from 'node:assert/strict'
import {spawn} from 'node:child_process'
import {mkdtemp, rm, writeFile} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import test from 'node:test'
import {buildSearchIndex, serializeSearchIndex} from '../../src/lib/search/buildIndex.ts'
import {newsCategoryOptions} from '../../sanity/schemaTypes/newsCategories.ts'
import {getTranslations} from '../../src/i18n/index.ts'

const base = process.env.SEARCH_TEST_BASE_URL ?? 'http://localhost:4321'
const executable = process.env.BROWSER_EXECUTABLE
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
const fixtures = serializeSearchIndex(buildSearchIndex(Array.from({length: 27}, (_, index) => ({
  _id: `search-fixture-${String(index).padStart(2, '0')}`,
  _type: ['publicInformationGuide', 'newsArticle', 'directoryListing'][index % 3],
  language: 'ne', slug: `search-fixture-${index}`,
  title: `NAV सम्बन्धी जानकारी र सेवा ${index}`,
  summary: 'नर्वेमा सार्वजनिक सेवा र आवश्यक जानकारी।',
  category: index % 3 === 1 ? 'health-welfare' : 'legal-services',
  responsibleAgency: 'NAV', date: '2026-01-01', city: 'Oslo',
  searchKeywords: ['private-editorial-synonym'],
})), 'ne'))
const categoryFixtures = Object.fromEntries(['ne', 'nb'].map((language) => [
  language,
  serializeSearchIndex(buildSearchIndex(newsCategoryOptions.map(({value}, index) => ({
    _id: `${language}-${value}`, _type: 'newsArticle', language,
    slug: `category-fixture-${value}`, title: `Category fixture ${index}`,
    summary: 'Category compatibility fixture', category: value,
  })), language)),
]))

test('shared-search browser interactions and responsive production content', async (t) => {
  assert.ok(executable, 'Set BROWSER_EXECUTABLE to a headless Chromium executable')
  assert.equal((await fetch(`${base}/ne/`)).status, 200, 'Start Astro before running browser tests')
  const profile = await mkdtemp(join(tmpdir(), 'nepali-search-browser-'))
  const browser = spawn(executable, [
    '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
    '--remote-allow-origins=*', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
  ], {stdio: ['ignore', 'ignore', 'pipe']})
  let stderr = ''
  browser.stderr.on('data', (data) => {stderr += data.toString()})
  let socket
  try {
    let port
    for (let attempt = 0; attempt < 300 && !port; attempt++) {
      port = stderr.match(/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)\//)?.[1]
      if (!port) await sleep(100)
    }
    assert.ok(port, `Chromium did not expose DevTools: ${stderr.slice(-1200)}`)
    const page = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, {method: 'PUT'})).json()
    socket = new WebSocket(page.webSocketDebuggerUrl)
    await new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve, {once: true})
      socket.addEventListener('error', reject, {once: true})
    })
    let sequence = 0
    const pending = new Map()
    const send = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++sequence
      pending.set(id, {resolve, reject})
      socket.send(JSON.stringify({id, method, params}))
    })
    let mode = 'fixture'
    let forumMode = 'fixture'
    const forumTopics = Array.from({length: 6}, (_, index) => ({
      title: ['नर्वेमा स्वास्थ्य सेवाबारे अनुभव', 'काम र रोजगारीसम्बन्धी प्रश्न', 'परिवार र बालबालिकाबारे छलफल',
        'शिक्षा र विद्यार्थी जीवन', 'नर्वेमा बसोबाससम्बन्धी अनुभव', 'समुदायका समाचारबारे छलफल'][index],
      replyCount: index, lastPostedAt: '2026-11-07T10:00:00Z',
      role: index % 2 ? 'newsDiscussion' : 'guideQuestions',
      url: `https://forum.nepali.no/t/homepage-presentation-${index}/${index + 1}`,
    }))
    let delay = 0
    let indexRequests = []
    const browserErrors = []
    const interceptErrors = []
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data)
      if (message.id && pending.has(message.id)) {
        const promise = pending.get(message.id)
        pending.delete(message.id)
        message.error ? promise.reject(new Error(message.error.message)) : promise.resolve(message.result)
      }
      if (message.method === 'Runtime.exceptionThrown') browserErrors.push(message.params.exceptionDetails.text)
      if (message.method === 'Fetch.requestPaused') {
        const {requestId, request} = message.params
        if (request.url.includes('/api/forum-homepage-discussions')) {
          void send('Fetch.fulfillRequest', {
            requestId, responseCode: forumMode === 'error' ? 503 : 200,
            responseHeaders: [{name: 'content-type', value: 'application/json'}],
            body: Buffer.from(JSON.stringify({topics: forumMode === 'empty' ? [] : forumTopics})).toString('base64'),
          }).catch((error) => interceptErrors.push(error.message))
          return
        }
        indexRequests.push(request.url)
        const selectedMode = mode
        const handle = async () => {
          if (delay) await sleep(delay)
          if (selectedMode === 'real') return send('Fetch.continueRequest', {requestId})
          return send('Fetch.fulfillRequest', {
            requestId, responseCode: selectedMode === 'error' ? 503 : 200,
            responseHeaders: [{name: 'content-type', value: 'application/json'}],
            body: Buffer.from(JSON.stringify(selectedMode === 'error' ? {ok: false} :
              selectedMode === 'categories' ? categoryFixtures[new URL(request.url).pathname.split('/')[1]] :
              fixtures)).toString('base64'),
          })
        }
        void handle().catch((error) => interceptErrors.push(error.message))
      }
    })
    const evaluate = async (expression) => {
      const response = await send('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true})
      if (response.exceptionDetails) throw new Error(response.exceptionDetails.text)
      return response.result.value
    }
    const wait = async (expression) => {
      for (let attempt = 0; attempt < 120; attempt++) {
        if (await evaluate(expression)) return
        await sleep(100)
      }
      throw new Error(`Timed out: ${expression}`)
    }
    const navigate = async (path) => {
      await evaluate('window.__previousSearchDocument = true')
      await send('Page.navigate', {url: `${base}${path}`})
      await wait(`!window.__previousSearchDocument && document.readyState !== 'loading' && document.querySelector('[data-content-search]') && document.querySelector('[data-search-browse]')?.hidden`)
      await evaluate('scrollTo(0, 0)')
    }
    const query = async (value) => evaluate(`(() => {
      const input = document.querySelector('[data-content-search] input');
      input.value = ${JSON.stringify(value)};
      input.dispatchEvent(new Event('input', {bubbles:true}));
    })()`)
    const count = () => evaluate(`document.querySelector('[data-search-list]').children.length`)
    const status = () => evaluate(`document.querySelector('[data-search-status]').textContent`)
    await send('Page.enable')
    await send('Runtime.enable')
    await send('Fetch.enable', {patterns: [
      {urlPattern: '*search-index.json*', requestStage: 'Request'},
      {urlPattern: '*/api/forum-homepage-discussions*', requestStage: 'Request'},
    ]})
    await send('Emulation.setDeviceMetricsOverride', {width: 390, height: 1100, deviceScaleFactor: 1, mobile: true})
    const screenshot = async (name) => {
      const image = await send('Page.captureScreenshot', {format: 'png', fromSurface: true})
      await writeFile(join(tmpdir(), `nepali-shared-search-${name}.png`), Buffer.from(image.data, 'base64'))
    }

    await t.test('empty and short queries do not fetch; matching announces counts and limits inline results to six', async () => {
      indexRequests = []
      await navigate('/ne/')
      assert.equal(await count(), 0)
      assert.equal(await evaluate(`document.querySelector('[data-search-panel]').hidden`), true)
      await query('N')
      await sleep(300)
      assert.equal(indexRequests.length, 0)
      assert.match(await status(), /दुई/)
      await query('NAV')
      await wait(`document.querySelector('[data-search-list]').children.length === 6`)
      assert.equal(indexRequests.length, 1)
      assert.match(await status(), /27/)
      assert.equal(new URL(indexRequests[0]).search, '')
      assert.deepEqual(await evaluate(`Array.from(new Set([...document.querySelectorAll('.content-search__tag')].map(e=>e.textContent))).sort()`),
        ['डाइरेक्टरी', 'मार्गदर्शन', 'समाचार'].sort())
      assert.equal(await evaluate(`document.querySelector('[data-search-full]').hidden`), false)
      assert.match(await evaluate(`document.querySelector('[data-search-full]').href`), /\/ne\/search\/\?q=NAV$/)
      assert.equal(await evaluate(`document.activeElement === document.querySelector('[data-content-search] input')`), false)
      await screenshot('mixed-390')
      await send('Emulation.setDeviceMetricsOverride', {width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false})
      assert.equal(await evaluate('document.documentElement.scrollWidth <= document.documentElement.clientWidth'), true)
      await screenshot('mixed-1440')
      await send('Emulation.setDeviceMetricsOverride', {width: 390, height: 1100, deviceScaleFactor: 1, mobile: true})
    })

    await t.test('keywords match without becoming public tags; no-result state offers only eligible archives', async () => {
      await query('private-editorial-synonym')
      await sleep(300)
      await wait(`document.querySelector('[data-search-list]').children.length === 6`)
      assert.equal(await evaluate(`document.querySelector('[data-search-list]').textContent.includes('private-editorial-synonym')`), false)
      await query('zzzz-no-match')
      await wait(`document.querySelector('[data-search-list]').children.length === 0`)
      assert.match(await status(), /भेटिएन/)
      assert.equal(await evaluate(`document.querySelector('[data-search-browse]').hidden`), false)
      assert.deepEqual(await evaluate(`[...document.querySelector('[data-search-browse]').querySelectorAll('a')].map(e=>new URL(e.href).pathname)`),
        ['/ne/info/', '/ne/news/', '/ne/directory/'])
      assert.equal(indexRequests.length, 1)
      await screenshot('no-results')
    })

    await t.test('keyboard focus, Escape, clear and Enter use native form/link behavior', async () => {
      await query('NAV')
      await wait(`document.querySelector('[data-search-list]').children.length === 6`)
      await evaluate(`document.querySelector('[data-content-search] input').focus()`)
      assert.equal(await evaluate(`getComputedStyle(document.activeElement).outlineWidth`), '3px')
      await send('Input.dispatchKeyEvent', {type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27})
      await send('Input.dispatchKeyEvent', {type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27})
      assert.equal(await evaluate(`document.querySelector('[data-search-panel]').hidden`), true)
      assert.equal(await evaluate(`document.querySelector('[data-content-search] input').value`), 'NAV')
      await evaluate(`document.querySelector('[data-search-clear]').click()`)
      assert.equal(await count(), 0)
      assert.equal(await evaluate(`document.activeElement === document.querySelector('[data-content-search] input')`), true)
      await send('Input.insertText', {text: 'NAV'})
      await send('Input.dispatchKeyEvent', {type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r'})
      await send('Input.dispatchKeyEvent', {type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13})
      await wait(`location.pathname === '/ne/search/' && document.querySelector('[data-search-list]')?.children.length === 20`)
      assert.equal(await evaluate(`new URL(location.href).searchParams.get('q')`), 'NAV')
    })

    await t.test('full results expose accessible filters, more results and URL back/forward state', async () => {
      assert.equal(await count(), 20)
      assert.match(await status(), /27/)
      for (const width of [390, 768, 1440]) {
        await send('Emulation.setDeviceMetricsOverride', {width, height: 1100, deviceScaleFactor: 1, mobile: width === 390})
        assert.equal(await evaluate('document.documentElement.scrollWidth <= document.documentElement.clientWidth'), true)
        await screenshot(`full-${width}`)
      }
      await evaluate(`document.querySelector('[data-search-more]').click()`)
      await wait(`document.querySelector('[data-search-list]').children.length === 27`)
      for (const width of [390, 1440]) {
        await send('Emulation.setDeviceMetricsOverride', {width, height: 1100, deviceScaleFactor: 1, mobile: width === 390})
        for (const [type, tag] of [['guidance', 'मार्गदर्शन'], ['news', 'समाचार'], ['directory', 'डाइरेक्टरी']]) {
          await evaluate(`document.querySelector('[data-search-filter="${type}"]').click()`)
          await wait(`document.querySelector('[data-search-list]').children.length === 9`)
          assert.equal(await evaluate(`document.querySelector('[data-search-filter="${type}"]').getAttribute('aria-pressed')`), 'true')
          assert.deepEqual(await evaluate(`[...new Set([...document.querySelectorAll('.content-search__tag')].map(e=>e.textContent))]`), [tag])
          assert.equal(await evaluate('document.documentElement.scrollWidth <= document.documentElement.clientWidth'), true)
        }
        await evaluate(`document.querySelector('[data-search-filter="all"]').click()`)
        await wait(`document.querySelector('[data-search-list]').children.length === 20`)
        assert.equal(await evaluate(`document.querySelector('[data-search-filter="all"]').getAttribute('aria-pressed')`), 'true')
      }
      await evaluate(`document.querySelector('[data-search-filter="news"]').click()`)
      await wait(`document.querySelector('[data-search-list]').children.length === 9`)
      assert.equal(await evaluate(`new URL(location.href).searchParams.get('type')`), 'news')
      assert.equal(await evaluate(`document.querySelector('[data-search-filter="news"]').getAttribute('aria-pressed')`), 'true')
      assert.deepEqual(await evaluate(`[...new Set([...document.querySelectorAll('.content-search__tag')].map(e=>e.textContent))]`), ['समाचार'])
      await evaluate(`history.back()`)
      await wait(`!new URL(location.href).searchParams.has('type') && document.querySelector('[data-search-list]').children.length === 20`)
      await evaluate(`history.forward()`)
      await wait(`new URL(location.href).searchParams.get('type') === 'news' && document.querySelector('[data-search-list]').children.length === 9`)
    })

    await t.test('loading operations cannot replace newer queries or reopen a closed panel', async () => {
      delay = 650
      await navigate('/ne/')
      await query('NAV')
      await wait(`document.querySelector('[data-search-status]').textContent.includes('खोजिँदै')`)
      await screenshot('loading')
      await query('zzzz-no-match')
      await wait(`document.querySelector('[data-search-status]').textContent.includes('भेटिएन')`)
      assert.equal(await count(), 0)
      await navigate('/ne/')
      await query('NAV')
      await wait(`document.querySelector('[data-search-status]').textContent.includes('खोजिँदै')`)
      await evaluate(`document.querySelector('[data-content-search] input').dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}))`)
      await sleep(900)
      assert.equal(await evaluate(`document.querySelector('[data-search-panel]').hidden`), true)
      delay = 0
    })

    await t.test('Enter submits an updated query on the full results page', async () => {
      await navigate('/ne/search/?q=NAV')
      await wait(`document.querySelector('[data-search-list]').children.length === 20`)
      await evaluate(`(() => {
        const input = document.querySelector('[data-content-search] input')
        input.focus()
        input.select()
      })()`)
      await send('Input.insertText', {text: 'private-editorial-synonym'})
      await send('Input.dispatchKeyEvent', {type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r'})
      await send('Input.dispatchKeyEvent', {type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13})
      await wait(`new URL(location.href).searchParams.get('q') === 'private-editorial-synonym' && document.querySelector('[data-search-list]').children.length === 20`)
    })

    await t.test('full failure is announced safely and retry recovers', async () => {
      mode = 'error'
      await navigate('/ne/')
      await query('NAV')
      await wait(`!document.querySelector('[data-search-retry]').hidden`)
      assert.match(await status(), /उपलब्ध छैन/)
      assert.doesNotMatch(await status(), /Sanity|stack|query/)
      assert.equal(await evaluate(`document.querySelector('[data-search-browse]').hidden`), false)
      await screenshot('error')
      mode = 'fixture'
      await evaluate(`document.querySelector('[data-search-retry]').click()`)
      await wait(`document.querySelector('[data-search-list]').children.length === 6`)
    })

    await t.test('homepage search, Escape and clear work at mobile and desktop widths', async () => {
      for (const width of [390, 1440]) {
        await send('Emulation.setDeviceMetricsOverride', {width, height: 1100, deviceScaleFactor: 1, mobile: width === 390})
        await navigate('/ne/')
        await evaluate(`document.querySelector('[data-content-search] input').focus()`)
        await send('Input.insertText', {text: 'NAV'})
        await wait(`document.querySelector('[data-search-list]').children.length === 6`)
        assert.equal(await evaluate(`document.activeElement === document.querySelector('[data-content-search] input')`), true)
        assert.equal(await evaluate(`new Set([...document.querySelectorAll('.content-search__tag')].map(e => e.textContent)).size`), 3)
        await send('Input.dispatchKeyEvent', {type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27})
        await send('Input.dispatchKeyEvent', {type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27})
        assert.equal(await evaluate(`document.querySelector('[data-search-panel]').hidden`), true)
        await evaluate(`document.querySelector('[data-search-clear]').click()`)
        assert.equal(await evaluate(`document.querySelector('[data-content-search] input').value`), '')
        assert.equal(await evaluate(`document.querySelector('[data-content-search] input').placeholder`),
          'खोज्नुहोस् (जस्तै: Skattekort, work permit, मम पसल)...')
        assert.equal(await evaluate('document.documentElement.scrollWidth <= document.documentElement.clientWidth'), true)
      }
    })

    await t.test('real published homepage results fit 390, 768 and 1440 px without disturbing content', async () => {
      mode = 'real'
      for (const width of [390, 768, 1440]) {
        await send('Emulation.setDeviceMetricsOverride', {width, height: 1100, deviceScaleFactor: 1, mobile: width === 390})
        await navigate('/ne/')
        const initialHeight = await evaluate(`document.querySelector('.home-introduction').getBoundingClientRect().height`)
        assert.ok(initialHeight < 400, `Compact initial introduction: ${initialHeight}px`)
        const initialGuidance = await evaluate(`[...document.querySelectorAll('.guidance-topic__title')].map(e=>e.textContent.trim())`)
        const field = await evaluate(`(() => {
          const root = document.querySelector('[data-content-search]')
          const input = root.querySelector('input')
          const label = root.querySelector('label')
          const icon = root.querySelector('.content-search__icon')
          const rect = input.getBoundingClientRect()
          return {
            width: rect.width, height: rect.height, radius: getComputedStyle(input).borderRadius,
            placeholder: input.placeholder, textOverflow: getComputedStyle(input).textOverflow,
            label: label.textContent, labelFor: label.htmlFor, inputId: input.id,
            labelWidth: label.getBoundingClientRect().width, iconWidth: icon.getBoundingClientRect().width,
            iconHidden: icon.getAttribute('aria-hidden'), helpWidth: root.querySelector('[id$="-help"]').getBoundingClientRect().width,
            submit: !!root.querySelector('[type="submit"]'),
            fontSize: parseFloat(getComputedStyle(input).fontSize),
            overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
          }
        })()`)
        console.log('Search field', width, JSON.stringify(field))
        assert.ok(field.height >= (width >= 1024 ? 64 : 56) && field.height <= (width >= 1024 ? 72 : 60))
        assert.equal(field.radius, '9999px')
        assert.equal(field.placeholder, 'खोज्नुहोस् (जस्तै: Skattekort, work permit, मम पसल)...')
        assert.equal(field.textOverflow, 'ellipsis')
        assert.equal(field.label, 'nepali.no मा खोज्नुहोस्')
        assert.equal(field.labelFor, field.inputId)
        assert.ok(field.labelWidth <= 1 && field.helpWidth <= 1)
        assert.ok(field.iconWidth > 0 && field.iconHidden === 'true')
        assert.equal(field.submit, false)
        assert.ok(field.fontSize >= 16)
        assert.equal(field.overflow, false)
        await screenshot(`empty-${width}`)
        await query('नर्वे')
        await wait(`document.querySelector('[data-search-list]').children.length === 6 && document.fonts.check('16px Mukta')`)
        const metrics = await evaluate(`(() => {
          const root=document.querySelector('[data-content-search]'), input=root.querySelector('input');
          return {width:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,
            inputHeight:input.getBoundingClientRect().height,headerHeight:document.querySelector('.home-introduction').getBoundingClientRect().height,
            news:document.querySelectorAll('.latest-updates > li').length,
            guidance:[...document.querySelectorAll('.guidance-topic__title')].map(e=>e.textContent.trim()),
            emptyMedia:document.querySelectorAll('.upcoming-events__media:not(:has(img)), .directory-highlights__media:not(:has(img))').length,
            tagSize:getComputedStyle(root.querySelector('.content-search__tag')).fontSize,
            mukta:document.fonts.check('16px Mukta'),footer:!!document.querySelector('footer'),
            overflowing:[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>document.documentElement.clientWidth+0.1).slice(0,8).map(e=>({tag:e.tagName,cls:e.className,right:e.getBoundingClientRect().right}))};
        })()`)
        console.log('Search viewport', width, JSON.stringify({initialHeight, ...metrics}))
        assert.equal(metrics.scrollWidth, metrics.width)
        assert.ok(metrics.inputHeight >= 44)
        assert.equal(metrics.emptyMedia, 0)
        assert.equal(metrics.mukta, true)
        assert.equal(metrics.footer, true)
        assert.equal(metrics.news, 6)
        assert.deepEqual(metrics.guidance, initialGuidance)
        assert.equal(metrics.guidance.length, 6)
        await screenshot(width)
      }
    })
    await t.test('homepage polish preserves responsive search, Guidance and six-topic Forum presentation', async () => {
      for (const width of [390, 768, 1440]) {
        await send('Emulation.setDeviceMetricsOverride', {width, height: 1100, deviceScaleFactor: 1, mobile: width === 390})
        await navigate('/ne/')
        await wait(`document.querySelectorAll('.forum-activity__row').length === 6 && document.fonts.check('16px Mukta')`)
        const layout = await evaluate(`(() => {
          const hero = document.querySelector('.home-introduction');
          const input = hero.querySelector('input');
          const guidance = document.querySelector('.home-guidance');
          const summary = guidance.querySelector('.guidance-topic__summary');
          const forum = document.querySelector('.home-forum');
          const notice = forum.querySelector('.forum-activity__notice');
          const rows = [...forum.querySelectorAll('.forum-activity__row')];
          const style = getComputedStyle(summary);
          return {
            heroBackground: getComputedStyle(hero).backgroundImage,
            searchInside: hero.contains(input),
            searchBottom: hero.getBoundingClientRect().bottom - input.getBoundingClientRect().bottom,
            guidanceGap: guidance.getBoundingClientRect().top - hero.getBoundingClientRect().bottom,
            leading: parseFloat(style.lineHeight) / parseFloat(style.fontSize),
            size: style.fontSize, weight: style.fontWeight, clamp: style.webkitLineClamp,
            decorative: hero.querySelectorAll('img, picture').length,
            columns: getComputedStyle(forum.querySelector('.forum-activity')).gridTemplateColumns.split(' ').length,
            background: getComputedStyle(forum).backgroundColor,
            relationshipLabels: forum.querySelectorAll('p[data-topic-role], .forum-activity__role').length,
            roles: rows.map(row => row.dataset.topicRole),
            links: rows.map(row => row.querySelector('a').getAttribute('href')),
            replies: rows.map(row => row.querySelector('[data-topic-replies]').textContent),
            times: rows.map(row => row.querySelector('time').dateTime),
            external: rows.every(row => row.querySelector('a').target === '_blank' && row.querySelector('a').rel === 'noopener noreferrer'),
            notice: notice.textContent.trim(), noticeWidth: notice.getBoundingClientRect().width,
            gridWidth: forum.querySelector('.forum-activity').getBoundingClientRect().width,
            cardHeights: [...guidance.querySelectorAll('.guidance-topics a')].map(e => e.getBoundingClientRect().height),
            overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
          };
        })()`)
        console.log('Homepage polish', width, JSON.stringify(layout))
        assert.match(layout.heroBackground, /linear-gradient/)
        assert.equal(layout.searchInside, true)
        assert.ok(layout.searchBottom >= (width === 390 ? 28 : width === 768 ? 32 : 36) && layout.searchBottom <= 44)
        assert.ok(layout.guidanceGap >= (width === 390 ? 36 : 48) && layout.guidanceGap <= (width === 390 ? 44 : 60))
        assert.ok(Math.abs(layout.leading - (width === 390 ? 1.6 : 1.55)) < 0.01)
        assert.equal(layout.size, '15px')
        assert.equal(layout.weight, '400')
        assert.equal(layout.clamp, '2')
        assert.equal(layout.decorative, 0)
        assert.equal(layout.columns, width === 390 ? 1 : width === 768 ? 2 : 3)
        assert.equal(layout.background, 'rgb(245, 248, 251)')
        assert.equal(layout.relationshipLabels, 0)
        assert.deepEqual(layout.roles, forumTopics.map(topic => topic.role))
        assert.deepEqual(layout.links, forumTopics.map(topic => topic.url))
        assert.deepEqual(layout.replies, forumTopics.map(topic => String(topic.replyCount)))
        assert.ok(layout.times.every(time => time === '2026-11-07T10:00:00.000Z'))
        assert.equal(layout.external, true)
        assert.ok(layout.notice.length > 0)
        assert.ok(Math.abs(layout.noticeWidth - layout.gridWidth) < 1)
        assert.ok(Math.max(...layout.cardHeights) < 150)
        assert.equal(layout.overflow, false)
        await screenshot(`polish-${width}`)
      }
      for (const failure of ['empty', 'error']) {
        forumMode = failure
        await navigate('/ne/')
        await sleep(500)
        assert.equal(await evaluate(`getComputedStyle(document.querySelector('.home-forum')).display`), 'none')
        assert.equal(await evaluate(`document.querySelector('[data-forum-topics]').hidden`), true)
      }
      forumMode = 'fixture'
    })

    await t.test('Norwegian search remains News-only; oversized URL queries are not silently truncated', async () => {
      mode = 'real'
      const norwegian = await (await fetch(`${base}/nb/search-index.json`)).json()
      assert.ok(norwegian.documents.length > 0)
      await navigate('/nb/')
      assert.equal(await evaluate(`document.querySelector('[data-content-search] input').placeholder`),
        'Søk (f.eks. skattekort, arbeidstillatelse, momo-restaurant)...')
      await query(norwegian.documents[0].title)
      await wait(`document.querySelector('[data-search-list]').children.length > 0`)
      assert.deepEqual(await evaluate(`[...new Set([...document.querySelectorAll('.content-search__tag')].map(e=>e.textContent))]`), ['Nyheter'])
      assert.equal(await evaluate(`[...document.querySelector('[data-search-list]').querySelectorAll('a')].every(e=>new URL(e.href).pathname.startsWith('/nb/news/'))`), true)
      indexRequests = []
      await evaluate('window.__previousSearchDocument = true')
      await send('Page.navigate', {url: `${base}/ne/search/?q=${'n'.repeat(161)}`})
      await wait(`!window.__previousSearchDocument && document.querySelector('[data-search-status]')?.textContent.includes('160')`)
      assert.equal(await evaluate(`document.querySelector('[data-content-search] input').value.length`), 161)
      assert.equal(indexRequests.length, 0)
    })

    await t.test('mixed final and legacy News categories match and display localized labels in both languages', async () => {
      mode = 'categories'
      for (const language of ['ne', 'nb']) {
        await navigate(`/${language}/`)
        for (const {value} of newsCategoryOptions) {
          const label = getTranslations(language).news.categories[value]
          const path = `/${language}/news/category-fixture-${value}/`
          await query(label)
          await wait(`document.querySelector('[data-search-list] a[href="${path}"]')`)
          assert.ok(await evaluate(`document.querySelector('[data-search-list] a[href="${path}"]').textContent.includes(${JSON.stringify(label)})`))
          assert.equal(await evaluate(`document.querySelector('[data-search-list]').textContent.includes('legacy: please reassign')`), false)
          assert.equal(await evaluate(`[...document.querySelectorAll('[data-search-list] a')].every(a => new URL(a.href).pathname.startsWith('/${language}/news/'))`), true)
        }
      }
      mode = 'fixture'
    })
    assert.deepEqual(browserErrors, [])
    assert.deepEqual(interceptErrors, [])
  } finally {
    socket?.close()
    browser.kill('SIGTERM')
    await Promise.race([new Promise((resolve) => browser.once('exit', resolve)), sleep(3000)])
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        await rm(profile, {recursive: true, force: true})
        break
      } catch (error) {
        if (attempt === 4) throw error
        await sleep(300)
      }
    }
  }
})
