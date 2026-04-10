import { useEffect, useState } from "react"

const MOBILE_BREAKPOINT = 768

const getIsMobile = () =>
    typeof window !== "undefined"
        ? window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`).matches
        : false

export function useIsMobile() {
    const [isMobile, setIsMobile] = useState<boolean>(getIsMobile)

    useEffect(() => {
        const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)

        const onChange = (event: MediaQueryListEvent) => {
            setIsMobile(event.matches)
        }

        mql.addEventListener('change', onChange)
        return () => mql.removeEventListener('change', onChange)
    }, [])

    return isMobile
}