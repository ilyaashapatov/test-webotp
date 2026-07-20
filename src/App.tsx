import { useCallback, useEffect, useRef, useState } from 'react'

import { InputOtpCode } from './components'
import { useFireworks } from './hooks/useFireworks'

import './App.css'

enum Stages {
  init = 'init',
  otp = 'otp',
}

export const App = () => {
  const inputCountCode = useRef(5)
  const containerRef = useRef<HTMLFormElement>(null);
  const isTriggeredRef = useRef(false);
  const handleRestartWebOtp = useRef<() => void>(null)
  const [stage, setStage] = useState<Stages>(Stages.init)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [value, setValue] = useState<string>('')

  const { triggerFireworks } = useFireworks();

  const setFireWorks = useCallback((val: string) => {
    if (val.length === 5 && !isTriggeredRef.current) {
      if (containerRef.current) {
        // Находим координаты всего блока с инпутами
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Взрываем салют прямо над кодом
        triggerFireworks({ clientX: centerX, clientY: centerY });
        isTriggeredRef.current = true;
      }

      setIsLoading(true)
    }
  }, [value])

  useEffect(() => {
    setFireWorks(value)
  }, [value])

  return (
    <>
      <section id="center">
        {stage === Stages.init && (
          <button
            type="button"
            className="counter"
            onClick={() => setStage(Stages.otp)}
          >
            Готов ввести СМСку
          </button>
        )}

        {stage === Stages.otp && (
          <form
            ref={containerRef}
            autoComplete='on'
          >
            <InputOtpCode
              disabled={isLoading}
              error=""
              inputCount={inputCountCode.current}
              isAutoFocus={true}
              name="confirmPassword"
              value={value}
              webOtpEnabled={true}
              onChange={setValue}
              onPasteWebOtp={(val) => {
                console.log('onPasteWebOtp', val)
              }}
              onErrorWebOtp={(err) => {
                console.log('onErrorWebOtp', err)
              }}
              onRestartWebOtp={(restart) => {
                handleRestartWebOtp.current = restart
              }}
            />
          </form>
        )}
      </section>

      <section id="spacer"></section>
    </>
  )
}
