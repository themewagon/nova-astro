"use client"

import * as React from "react"
import { useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"

interface Tab {
  id: string
  label: string
  data?: Record<string, string>
}

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  tabs: Tab[]
  activeTab?: string
  tabGroup?: string
  onTabChange?: (tabId: string) => void
}

type TabPosition = { x: number; width: number }

const emptyPosition: TabPosition = { x: 0, width: 0 }

const readTabPosition = (element: HTMLButtonElement | null): TabPosition => {
  if (!element || element.offsetWidth === 0 || element.getClientRects().length === 0) {
    return emptyPosition
  }

  return { x: element.offsetLeft, width: element.offsetWidth }
}

const DeveloperTabs = React.forwardRef<HTMLDivElement, TabsProps>(
  ({ className, tabs, activeTab, tabGroup, onTabChange, ...props }, ref) => {
    const initialIndex = Math.max(0, tabs.findIndex((tab) => tab.id === activeTab))
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
    const [activeIndex, setActiveIndex] = useState(initialIndex)
    const [hoverStyle, setHoverStyle] = useState<TabPosition>(emptyPosition)
    const [activeStyle, setActiveStyle] = useState<TabPosition>(emptyPosition)
    const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
    const hoveredIndexRef = useRef<number | null>(null)
    const refreshFrame = useRef<number | null>(null)

    const updatePosition = (setter: React.Dispatch<React.SetStateAction<TabPosition>>, next: TabPosition) => {
      setter((previous) => (previous.x === next.x && previous.width === next.width ? previous : next))
    }

    const measureTab = (index: number) => {
      updatePosition(setActiveStyle, readTabPosition(tabRefs.current[index]))
    }

    const measureHoveredTab = () => {
      const index = hoveredIndexRef.current
      if (index === null) return
      const position = readTabPosition(tabRefs.current[index])
      if (position.width === 0) {
        hoveredIndexRef.current = null
        setHoveredIndex(null)
        return
      }
      updatePosition(setHoverStyle, position)
    }

    const setHoveredTab = (index: number) => {
      const position = readTabPosition(tabRefs.current[index])
      if (position.width === 0) return
      updatePosition(setHoverStyle, position)
      hoveredIndexRef.current = index
      setHoveredIndex(index)
    }

    const clearHoveredTab = () => {
      hoveredIndexRef.current = null
      setHoveredIndex(null)
    }

    useEffect(() => {
      const nextIndex = tabs.findIndex((tab) => tab.id === activeTab)
      if (nextIndex >= 0) setActiveIndex(nextIndex)
    }, [activeTab, tabs])

    useEffect(() => {
      const frame = requestAnimationFrame(() => measureTab(activeIndex))
      return () => cancelAnimationFrame(frame)
    }, [activeIndex, tabs])

    useEffect(() => {
      const refreshPosition = (event?: Event) => {
        const detail = (event as CustomEvent<{ group?: string }> | undefined)?.detail
        if (detail?.group && detail.group !== tabGroup) return
        if (refreshFrame.current !== null) return
        refreshFrame.current = requestAnimationFrame(() => {
          refreshFrame.current = null
          measureTab(activeIndex)
          measureHoveredTab()
        })
      }
      const selectExternalTab = (event: Event) => {
        const detail = (event as CustomEvent<{ group?: string; tabId?: string }>).detail
        if (!detail?.tabId || (detail.group && detail.group !== tabGroup)) return
        const nextIndex = tabs.findIndex((tab) => tab.id === detail.tabId)
        if (nextIndex >= 0) setActiveIndex(nextIndex)
      }
        window.addEventListener("developer-tabs-refresh", refreshPosition)
        window.addEventListener("developer-tabs-select", selectExternalTab)
      window.addEventListener("resize", refreshPosition)
      return () => {
        window.removeEventListener("developer-tabs-refresh", refreshPosition)
        window.removeEventListener("developer-tabs-select", selectExternalTab)
        window.removeEventListener("resize", refreshPosition)
        if (refreshFrame.current !== null) cancelAnimationFrame(refreshFrame.current)
      }
    }, [activeIndex, tabGroup, tabs])

    return (
      <div ref={ref} className={cn("relative", className)} data-developer-tabs data-tab-group={tabGroup} {...props}>
        <div className="relative min-w-max">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-0 h-[30px] rounded-[6px] bg-brand-dark/[0.08] transition-[transform,width,opacity] duration-300 ease-out"
            style={{ width: `${hoverStyle.width}px`, transform: `translate3d(${hoverStyle.x}px, 0, 0)`, opacity: hoveredIndex !== null ? 1 : 0 }}
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute bottom-[-6px] left-0 h-[2px] bg-brand-dark transition-[transform,width] duration-300 ease-out"
            style={{ width: `${activeStyle.width}px`, transform: `translate3d(${activeStyle.x}px, 0, 0)` }}
          />
          <div className="relative flex items-center" role="tablist">
            {tabs.map((tab, index) => (
              <button
                key={tab.id}
                ref={(element) => { tabRefs.current[index] = element }}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                aria-current={index === activeIndex ? "page" : undefined}
                data-tab-id={tab.id}
                {...tab.data}
                className={cn(
                  "flex h-[30px] cursor-pointer items-center px-3 py-2 transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50",
                  index === activeIndex ? "text-brand-dark" : "text-brand-dark/60 hover:text-brand-dark",
                )}
                onMouseEnter={() => {
                  setHoveredTab(index)
                }}
                onMouseLeave={clearHoveredTab}
                onFocus={() => setHoveredTab(index)}
                onBlur={clearHoveredTab}
                onClick={() => { setActiveIndex(index); onTabChange?.(tab.id) }}
              >
                <span className="flex h-full items-center justify-center whitespace-nowrap text-sm font-medium leading-5">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  },
)

DeveloperTabs.displayName = "DeveloperTabs"
export { DeveloperTabs }
