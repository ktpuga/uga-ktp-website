'use client'

import React, { useEffect, useRef, useState } from 'react'

const UNITS = [
  { key: 'days', label: 'Days', rank: 'A', suit: '♠', suitColor: 'text-white' },
  { key: 'hours', label: 'Hours', rank: 'K', suit: '♥', suitColor: 'text-[#c41e3a]' },
  { key: 'minutes', label: 'Mins', rank: 'Q', suit: '♦', suitColor: 'text-[#c41e3a]' },
  { key: 'seconds', label: 'Secs', rank: 'J', suit: '♣', suitColor: 'text-white' },
]

const SUIT_DIVIDERS = [
  { symbol: '♠', color: 'text-white' },
  { symbol: '♥', color: 'text-[#c41e3a]' },
  { symbol: '♦', color: 'text-[#c41e3a]' },
]

const formatNumber = (num) => String(num).padStart(2, '0')

const CountdownTimer = ({ targetDate }) => {
  const calculateTimeLeft = () => {
    const difference = +new Date(targetDate) - +new Date()
    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 }
    }
    return {
      days: Math.floor(difference / (1000 * 60 * 60 * 24)),
      hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((difference / 1000 / 60) % 60),
      seconds: Math.floor((difference / 1000) % 60),
    }
  }

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft)
  const [visible, setVisible] = useState(false)
  const [secondsPulse, setSecondsPulse] = useState(false)
  const prevSeconds = useRef(timeLeft.seconds)

  useEffect(() => {
    setVisible(true)
    const timer = setInterval(() => setTimeLeft(calculateTimeLeft()), 1000)
    return () => clearInterval(timer)
  }, [targetDate])

  useEffect(() => {
    if (prevSeconds.current === timeLeft.seconds) return
    prevSeconds.current = timeLeft.seconds
    setSecondsPulse(true)
    const pulseTimer = setTimeout(() => setSecondsPulse(false), 400)
    return () => clearTimeout(pulseTimer)
  }, [timeLeft.seconds])

  return (
    <div
      className={`mt-5 flex w-full flex-col items-center px-2 sm:mt-8 sm:px-0 transition-all duration-700 ease-out ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
      }`}
    >
      <p className="mb-4 text-center text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[#d4af37] sm:mb-6 sm:text-xs sm:tracking-[0.35em]">
        Deal starts in
      </p>

      <div className="flex w-full max-w-full items-end justify-center">
        {UNITS.map((unit, index) => (
          <React.Fragment key={unit.key}>
            <div className="flex min-w-[3.25rem] shrink-0 flex-col items-center sm:min-w-[4.5rem] md:min-w-[5.5rem] lg:min-w-[7rem] xl:min-w-[8rem]">
              <span
                className={`mb-0.5 flex items-baseline gap-0.5 text-[0.6rem] font-bold leading-none sm:mb-1 sm:text-sm md:text-base ${unit.suitColor}`}
                aria-hidden
              >
                <span>{unit.rank}</span>
                <span>{unit.suit}</span>
              </span>

              <span
                className={`font-mono text-xl font-bold tabular-nums transition-colors duration-300 sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl ${
                  unit.key === 'seconds' && secondsPulse ? 'text-[#f0d060]' : 'text-white'
                }`}
              >
                {formatNumber(timeLeft[unit.key])}
              </span>

              <span className="mt-0.5 text-[0.45rem] font-semibold uppercase tracking-[0.12em] text-[#d4af37] sm:mt-1 sm:text-[0.6rem] sm:tracking-[0.18em] md:text-xs md:tracking-[0.22em]">
                {unit.label}
              </span>
            </div>

            {index < UNITS.length - 1 && (
              <span
                className={`hidden select-none self-center px-0.5 text-xs sm:inline sm:px-2 sm:text-base md:px-4 md:text-lg lg:px-6 lg:text-xl xl:px-8 xl:text-2xl ${SUIT_DIVIDERS[index].color}`}
                aria-hidden
              >
                {SUIT_DIVIDERS[index].symbol}
              </span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

export default CountdownTimer
