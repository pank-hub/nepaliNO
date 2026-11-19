import {
  buildChartCsv,
  buildChartCsvFilename,
  type ChartClientData,
} from './interactive.ts'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia(REDUCED_MOTION_QUERY).matches

const parseChartData = (figure: HTMLElement): ChartClientData | null => {
  const script = figure.querySelector<HTMLScriptElement>('script[data-chart-payload]')
  if (!script?.textContent) return null
  try {
    return JSON.parse(script.textContent) as ChartClientData
  } catch {
    return null
  }
}

const createTooltipRow = (
  label: string,
  valueText: string,
  colorIndex?: number,
  options: {active?: boolean; total?: boolean} = {},
): HTMLElement => {
  const row = document.createElement('div')
  row.className = 'editorial-chart__tooltip-row'
  if (options.active) row.classList.add('is-focused')
  if (options.total) row.classList.add('is-total')

  const left = document.createElement('span')
  left.className = 'editorial-chart__tooltip-label'
  if (typeof colorIndex === 'number') {
    const dot = document.createElement('span')
    dot.className = `editorial-chart__tooltip-dot chart-series-${colorIndex}`
    dot.setAttribute('aria-hidden', 'true')
    left.appendChild(dot)
  }
  const text = document.createElement('span')
  text.textContent = label
  left.appendChild(text)

  const val = document.createElement('strong')
  val.className = 'editorial-chart__tooltip-value'
  val.textContent = valueText

  row.append(left, val)
  return row
}

const getAnchorFromElement = (
  el: Element,
): {x: number; y: number; categoryIndex: number; seriesIndex: number} | null => {
  const catRaw = el.getAttribute('data-cat-idx')
  const serRaw = el.getAttribute('data-series-idx')
  if (catRaw === null || serRaw === null) return null
  const categoryIndex = Number(catRaw)
  const seriesIndex = Number(serRaw)
  if (!Number.isInteger(categoryIndex) || !Number.isInteger(seriesIndex)) return null

  const tag = el.tagName.toLowerCase()
  if (tag === 'rect') {
    const x = Number(el.getAttribute('x') ?? 0)
    const y = Number(el.getAttribute('y') ?? 0)
    const width = Number(el.getAttribute('width') ?? 0)
    const height = Number(el.getAttribute('height') ?? 0)
    const originX = Number(el.getAttribute('data-origin-x') ?? x)
    const isHorizontal = el.classList.contains('chart-bar--horizontal')
    return {
      x: isHorizontal ? (x + width / 2 >= originX ? x + width : x) : x + width / 2,
      y: isHorizontal ? y + height / 2 : y,
      categoryIndex,
      seriesIndex,
    }
  }
  if (tag === 'circle') {
    return {
      x: Number(el.getAttribute('cx') ?? 0),
      y: Number(el.getAttribute('cy') ?? 0),
      categoryIndex,
      seriesIndex,
    }
  }
  const lx = Number(el.getAttribute('data-tip-x'))
  const ly = Number(el.getAttribute('data-tip-y'))
  return {
    x: Number.isFinite(lx) ? lx : 180,
    y: Number.isFinite(ly) ? ly : 90,
    categoryIndex,
    seriesIndex,
  }
}

const animateLinePaths = (figure: HTMLElement) => {
  if (prefersReducedMotion()) return
  figure.querySelectorAll<SVGPathElement>('.chart-line-path').forEach((path, idx) => {
    if (typeof path.getTotalLength !== 'function' || typeof path.animate !== 'function') return
    const len = path.getTotalLength()
    if (!Number.isFinite(len) || len <= 0) return
    const prevDash = path.style.strokeDasharray
    path.style.strokeDasharray = `${len}`
    const anim = path.animate(
      [{strokeDashoffset: `${len}`}, {strokeDashoffset: '0'}],
      {duration: 620, delay: idx * 80, easing: 'cubic-bezier(0.22, 1, 0.36, 1)'},
    )
    anim.onfinish = () => {
      path.style.strokeDasharray = prevDash
    }
  })
}

const setupScrollReveal = (figure: HTMLElement) => {
  if (prefersReducedMotion()) {
    figure.classList.add('is-revealed')
    return
  }
  if (typeof IntersectionObserver !== 'function') {
    figure.classList.add('is-revealed')
    return
  }
  figure.classList.add('is-animated')
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        figure.classList.add('is-revealed')
        animateLinePaths(figure)
        observer.disconnect()
      }
    },
    {threshold: 0.15},
  )
  observer.observe(figure)
}

export const enhanceEditorialChart = (figure: HTMLElement): void => {
  if (figure.dataset.chartBound === '1') return
  const data = parseChartData(figure)
  if (!data) return

  figure.dataset.chartBound = '1'
  figure.classList.add('is-interactive')
  figure.dataset.view = 'chart'
  setupScrollReveal(figure)

  const hiddenSeries = new Set<number>()
  let activeCategory: number | null = null
  let activeSeries: number | null = null
  let lockedPolarSlice: number | null = null

  const toolbar = figure.querySelector<HTMLElement>('.editorial-chart__toolbar')
  if (toolbar) toolbar.hidden = false

  const chartBtn = figure.querySelector<HTMLButtonElement>('[data-chart-view="chart"]')
  const tableBtn = figure.querySelector<HTMLButtonElement>('[data-chart-view="table"]')
  const csvBtn = figure.querySelector<HTMLButtonElement>('[data-chart-action="csv"]')
  const detailsEl = figure.querySelector<HTMLDetailsElement>('.editorial-chart__data')
  const resetBtn = figure.querySelector<HTMLButtonElement>('[data-chart-action="reset-series"]')
  const legendButtons = Array.from(
    figure.querySelectorAll<HTMLButtonElement>('.editorial-chart__legend-btn'),
  )

  const setView = (view: 'chart' | 'table') => {
    figure.dataset.view = view
    if (chartBtn) chartBtn.setAttribute('aria-pressed', String(view === 'chart'))
    if (tableBtn) tableBtn.setAttribute('aria-pressed', String(view === 'table'))
    if (detailsEl) {
      detailsEl.open = view === 'table'
    }
    if (view === 'table') {
      clearActive()
    }
  }

  chartBtn?.addEventListener('click', () => setView('chart'))
  tableBtn?.addEventListener('click', () => setView('table'))

  csvBtn?.addEventListener('click', () => {
    const csv = buildChartCsv(data)
    const blob = new Blob([csv], {type: 'text/csv;charset=utf-8'})
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = buildChartCsvFilename(data.title)
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 100)
  })

  const syncLegendState = () => {
    legendButtons.forEach((btn) => {
      const idx = Number(btn.dataset.legendIndex)
      const pressed = data.polar ? lockedPolarSlice === null || lockedPolarSlice === idx : !hiddenSeries.has(idx)
      btn.setAttribute('aria-pressed', String(pressed))
      btn.classList.toggle('is-muted', !pressed)
    })

    if (!data.polar) {
      figure.querySelectorAll<SVGElement>('[data-series-idx]').forEach((el) => {
        const sIdx = Number(el.getAttribute('data-series-idx'))
        el.classList.toggle('is-series-hidden', hiddenSeries.has(sIdx))
      })
      if (resetBtn) {
        resetBtn.hidden = hiddenSeries.size === 0
      }
    }
  }

  const getVisibleStages = (): {
    stage: HTMLElement
    svg: SVGSVGElement
    tooltip: HTMLElement
    crosshair: SVGLineElement | null
    donutPrimary: SVGTextElement | null
    donutSecondary: SVGTextElement | null
  }[] =>
    Array.from(figure.querySelectorAll<HTMLElement>('.editorial-chart__stage')).flatMap(
      (stage) => {
        const svg = stage.querySelector<SVGSVGElement>('.editorial-chart__svg')
        const tooltip = stage.querySelector<HTMLElement>('.editorial-chart__tooltip')
        if (!svg || !tooltip) return []
        return [
          {
            stage,
            svg,
            tooltip,
            crosshair: svg.querySelector<SVGLineElement>('.editorial-chart__crosshair'),
            donutPrimary: svg.querySelector<SVGTextElement>('.chart-donut-center__pct'),
            donutSecondary: svg.querySelector<SVGTextElement>('.chart-donut-center__label'),
          },
        ]
      },
    )

  const stages = getVisibleStages()

  const clearActive = () => {
    activeCategory = null
    activeSeries = null
    stages.forEach(({svg, tooltip, crosshair, donutPrimary, donutSecondary}) => {
      delete svg.dataset.hasActive
      svg
        .querySelectorAll('.is-active')
        .forEach((el) => el.classList.remove('is-active'))
      tooltip.hidden = true
      if (crosshair) crosshair.classList.remove('is-visible')
      if (donutPrimary) donutPrimary.textContent = ''
      if (donutSecondary) donutSecondary.textContent = ''
    })
  }

  const updateTooltipContent = (tooltip: HTMLElement, categoryIndex: number, focusedSeries: number | null) => {
    tooltip.replaceChildren()
    const catLabel =
      data.categories[categoryIndex] || `${data.labels.category} ${categoryIndex + 1}`

    if (data.polar) {
      const valueText = data.series[0]?.formattedValues[categoryIndex] ?? data.labels.unavailable
      const pctText = data.percentages[categoryIndex]
      const head = document.createElement('div')
      head.className = 'editorial-chart__tooltip-head'
      head.textContent = catLabel
      tooltip.appendChild(head)

      tooltip.appendChild(
        createTooltipRow(
          pctText ? `${pctText}` : data.series[0]?.label ?? '',
          valueText,
          categoryIndex % 8,
          {active: true},
        ),
      )
      return
    }

    const head = document.createElement('div')
    head.className = 'editorial-chart__tooltip-head'
    head.textContent = catLabel
    tooltip.appendChild(head)

    let visibleCount = 0
    for (const s of data.series) {
      if (hiddenSeries.has(s.index)) continue
      visibleCount += 1
      const formatted = s.formattedValues[categoryIndex] ?? data.labels.unavailable
      tooltip.appendChild(
        createTooltipRow(s.label, formatted, s.colorIndex, {
          active: focusedSeries === s.index && data.series.length > 1,
        }),
      )
    }

    const totalText = data.totals[categoryIndex]
    if (data.isStacked && visibleCount > 1 && totalText && hiddenSeries.size === 0) {
      tooltip.appendChild(
        createTooltipRow(data.labels.total, totalText, undefined, {total: true}),
      )
    }
  }

  const positionTooltip = (
    stage: HTMLElement,
    svg: SVGSVGElement,
    tooltip: HTMLElement,
    anchorSvgX: number,
    anchorSvgY: number,
  ) => {
    tooltip.hidden = false
    const viewBoxAttr = svg.getAttribute('viewBox')
    if (!viewBoxAttr) return
    const [, , vbW, vbH] = viewBoxAttr.split(/\s+/).map(Number)
    if (!vbW || !vbH) return

    const svgRect = svg.getBoundingClientRect()
    const stageRect = stage.getBoundingClientRect()
    if (!svgRect.width || !svgRect.height || !stageRect.width) return

    const scaleX = svgRect.width / vbW
    const scaleY = svgRect.height / vbH
    const pxX = svgRect.left - stageRect.left + anchorSvgX * scaleX
    const pxY = svgRect.top - stageRect.top + anchorSvgY * scaleY

    const tipWidth = tooltip.offsetWidth || 160
    const tipHeight = tooltip.offsetHeight || 56
    const pad = 8

    const clampedLeft = Math.max(
      pad,
      Math.min(stageRect.width - tipWidth - pad, pxX - tipWidth / 2),
    )
    const aboveTop = pxY - tipHeight - 12
    const belowTop = pxY + 14
    const finalTop = aboveTop >= pad ? aboveTop : Math.min(stageRect.height - tipHeight - pad, belowTop)

    tooltip.style.left = `${Math.round(clampedLeft)}px`
    tooltip.style.top = `${Math.round(Math.max(pad, finalTop))}px`
  }

  const showCategory = (categoryIndex: number, focusedSeries: number | null = null) => {
    if (categoryIndex < 0 || categoryIndex >= data.categories.length) return
    activeCategory = categoryIndex
    activeSeries = focusedSeries

    const hasMeasuredStage = stages.some(
      ({stage}) => stage.getBoundingClientRect().width > 0,
    )

    stages.forEach(({stage, svg, tooltip, crosshair, donutPrimary, donutSecondary}) => {
      // Only position visible tier when layout metrics exist (e.g., avoid hidden display:none tier).
      if (hasMeasuredStage && stage.getBoundingClientRect().width === 0) return

      svg.dataset.hasActive = '1'
      svg
        .querySelectorAll('.is-active')
        .forEach((el) => el.classList.remove('is-active'))

      const matching = Array.from(
        svg.querySelectorAll<SVGElement>(`.chart-target[data-cat-idx="${categoryIndex}"]`),
      ).filter((el) => {
        const sIdx = Number(el.getAttribute('data-series-idx'))
        return data.polar || !hiddenSeries.has(sIdx)
      })

      matching.forEach((el) => el.classList.add('is-active'))

      let anchorX: number | null = null
      let anchorY: number | null = null
      const preferred =
        focusedSeries !== null
          ? matching.find((el) => Number(el.getAttribute('data-series-idx')) === focusedSeries)
          : matching[0]
      if (preferred) {
        const anchor = getAnchorFromElement(preferred)
        if (anchor) {
          anchorX = anchor.x
          anchorY = anchor.y
        }
      }

      if (crosshair) {
        const catPositionsAttr = svg.getAttribute('data-cat-x')
        const plotTop = Number(svg.getAttribute('data-plot-top'))
        const plotBottom = Number(svg.getAttribute('data-plot-bottom'))
        if (catPositionsAttr && Number.isFinite(plotTop) && Number.isFinite(plotBottom)) {
          const catPositions = catPositionsAttr.split(',').map(Number)
          const cx = catPositions[categoryIndex]
          if (Number.isFinite(cx)) {
            crosshair.setAttribute('x1', String(cx))
            crosshair.setAttribute('x2', String(cx))
            crosshair.setAttribute('y1', String(plotTop))
            crosshair.setAttribute('y2', String(plotBottom))
            crosshair.classList.add('is-visible')
            if (anchorX === null) {
              anchorX = cx
              anchorY = (plotTop + plotBottom) / 2
            }
          }
        }
      }

      if (data.polar && donutPrimary && donutSecondary) {
        donutPrimary.textContent = data.percentages[categoryIndex] ?? ''
        const catLabel = data.categories[categoryIndex] ?? ''
        donutSecondary.textContent =
          catLabel.length > 16 ? `${catLabel.slice(0, 15)}…` : catLabel
      }

      updateTooltipContent(tooltip, categoryIndex, focusedSeries)
      if (anchorX !== null && anchorY !== null) {
        positionTooltip(stage, svg, tooltip, anchorX, anchorY)
      } else {
        tooltip.hidden = false
      }
    })
  }

  stages.forEach(({stage, svg}) => {
    const targets = Array.from(svg.querySelectorAll<SVGElement>('.chart-target'))
    targets.forEach((target) => {
      target.addEventListener('pointerenter', () => {
        const anchor = getAnchorFromElement(target)
        if (!anchor) return
        if (!data.polar && hiddenSeries.has(anchor.seriesIndex)) return
        showCategory(anchor.categoryIndex, anchor.seriesIndex)
      })

      target.addEventListener('focus', () => {
        const anchor = getAnchorFromElement(target)
        if (!anchor) return
        if (!data.polar && hiddenSeries.has(anchor.seriesIndex)) return
        showCategory(anchor.categoryIndex, anchor.seriesIndex)
      })

      target.addEventListener('click', (event) => {
        event.stopPropagation()
        const anchor = getAnchorFromElement(target)
        if (!anchor) return
        if (data.polar) {
          lockedPolarSlice =
            lockedPolarSlice === anchor.categoryIndex ? null : anchor.categoryIndex
          syncLegendState()
          if (lockedPolarSlice !== null) {
            showCategory(lockedPolarSlice, 0)
          } else {
            clearActive()
          }
          return
        }
        if (hiddenSeries.has(anchor.seriesIndex)) return
        showCategory(anchor.categoryIndex, anchor.seriesIndex)
      })

      target.addEventListener('keydown', (event: KeyboardEvent) => {
        const key = event.key
        if (key === 'Escape') {
          lockedPolarSlice = null
          syncLegendState()
          clearActive()
          return
        }
        const anchor = getAnchorFromElement(target)
        if (!anchor) return
        let delta = 0
        if (data.isHorizontal) {
          if (key === 'ArrowDown') delta = 1
          else if (key === 'ArrowUp') delta = -1
        } else if (key === 'ArrowRight' || key === 'ArrowDown') {
          delta = 1
        } else if (key === 'ArrowLeft' || key === 'ArrowUp') {
          delta = -1
        }
        if (!delta) return
        event.preventDefault()
        const nextCat =
          (anchor.categoryIndex + delta + data.categories.length) %
          data.categories.length
        const nextTarget =
          targets.find(
            (el) =>
              Number(el.getAttribute('data-cat-idx')) === nextCat &&
              Number(el.getAttribute('data-series-idx')) === anchor.seriesIndex,
          ) ??
          targets.find((el) => Number(el.getAttribute('data-cat-idx')) === nextCat)
        nextTarget?.focus()
      })
    })

    // Snap crosshair smoothly when hovering anywhere over the plot area in vertical Cartesian charts.
    if (!data.polar && !data.isHorizontal) {
      const catAttr = svg.getAttribute('data-cat-x')
      const plotLeft = Number(svg.getAttribute('data-plot-left'))
      const plotRight = Number(svg.getAttribute('data-plot-right'))
      const plotTop = Number(svg.getAttribute('data-plot-top'))
      const plotBottom = Number(svg.getAttribute('data-plot-bottom'))
      const viewBoxAttr = svg.getAttribute('viewBox')
      if (catAttr && viewBoxAttr && Number.isFinite(plotLeft) && Number.isFinite(plotRight)) {
        const catPositions = catAttr.split(',').map(Number)
        const [, , vbW, vbH] = viewBoxAttr.split(/\s+/).map(Number)
        svg.addEventListener('pointermove', (event) => {
          if ((event.target as Element | null)?.closest('.chart-target')) return
          const rect = svg.getBoundingClientRect()
          if (!rect.width || !rect.height || !vbW || !vbH) return
          const svgX = ((event.clientX - rect.left) / rect.width) * vbW
          const svgY = ((event.clientY - rect.top) / rect.height) * vbH
          if (svgX < plotLeft || svgX > plotRight || svgY < plotTop || svgY > plotBottom) {
            return
          }
          let nearestIdx = 0
          let nearestDist = Infinity
          catPositions.forEach((pos, idx) => {
            const dist = Math.abs(pos - svgX)
            if (dist < nearestDist) {
              nearestDist = dist
              nearestIdx = idx
            }
          })
          if (activeCategory !== nearestIdx || activeSeries !== null) {
            showCategory(nearestIdx, null)
          }
        })
      }
    }

    stage.addEventListener('pointerleave', () => {
      if (data.polar && lockedPolarSlice !== null) {
        showCategory(lockedPolarSlice, 0)
        return
      }
      clearActive()
    })

    svg.addEventListener('focusout', (event) => {
      const next = event.relatedTarget as Node | null
      if (next && stage.contains(next)) return
      if (data.polar && lockedPolarSlice !== null) {
        showCategory(lockedPolarSlice, 0)
        return
      }
      clearActive()
    })
  })

  // Interactive legend chips: spotlight on hover, toggle visibility / focus on click.
  legendButtons.forEach((btn) => {
    const idx = Number(btn.dataset.legendIndex)
    if (!Number.isInteger(idx)) return

    btn.addEventListener('pointerenter', () => {
      if (data.polar) {
        showCategory(idx, 0)
        return
      }
      if (hiddenSeries.has(idx)) return
      stages.forEach(({svg}) => {
        svg.dataset.hasSeriesSpotlight = String(idx)
        svg.querySelectorAll<SVGElement>('[data-series-idx]').forEach((el) => {
          const isMatch = Number(el.getAttribute('data-series-idx')) === idx
          el.classList.toggle('is-series-spotlight', isMatch)
          el.classList.toggle('is-series-dimmed', !isMatch)
        })
      })
    })

    btn.addEventListener('pointerleave', () => {
      if (data.polar) {
        if (lockedPolarSlice !== null) showCategory(lockedPolarSlice, 0)
        else clearActive()
        return
      }
      stages.forEach(({svg}) => {
        delete svg.dataset.hasSeriesSpotlight
        svg
          .querySelectorAll('.is-series-spotlight, .is-series-dimmed')
          .forEach((el) => el.classList.remove('is-series-spotlight', 'is-series-dimmed'))
      })
    })

    btn.addEventListener('click', () => {
      if (data.polar) {
        lockedPolarSlice = lockedPolarSlice === idx ? null : idx
        syncLegendState()
        if (lockedPolarSlice !== null) showCategory(lockedPolarSlice, 0)
        else clearActive()
        return
      }
      if (hiddenSeries.has(idx)) {
        hiddenSeries.delete(idx)
      } else if (hiddenSeries.size + 1 >= data.series.length) {
        // Clicking the last remaining visible series restores all series instead of blanking the chart.
        hiddenSeries.clear()
      } else {
        hiddenSeries.add(idx)
      }
      syncLegendState()
      if (activeCategory !== null) {
        showCategory(activeCategory, hiddenSeries.has(activeSeries ?? -1) ? null : activeSeries)
      }
    })
  })

  resetBtn?.addEventListener('click', () => {
    hiddenSeries.clear()
    syncLegendState()
    if (activeCategory !== null) showCategory(activeCategory, activeSeries)
  })
}

export const initEditorialCharts = (root: ParentNode = document): void => {
  root.querySelectorAll<HTMLElement>('.editorial-chart').forEach(enhanceEditorialChart)
}
