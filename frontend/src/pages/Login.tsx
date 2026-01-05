import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/app/store'
import { Form, Input, Button, message } from 'antd'
import { useEffect, useState } from 'react'

function LoginPage() {
  const navigate = useNavigate()
  const {
    login,
    verifyOTP,
    resetLoginFlow,
    isLoading,
    error,
    clearError,
    loginStep,
    pendingLoginData
  } = useAuthStore()

  const [otpCode, setOtpCode] = useState('')

  useEffect(() => {
    if (error) {
      message.error(error)
      clearError()
    }
  }, [error, clearError])

  const handleCredentialsSubmit = async (values: { username: string; password: string; email: string }) => {
    try {
      await login(values.username, values.password, values.email)
    } catch (err) {
      // Ошибка уже обработана в store
    }
  }

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (otpCode.length !== 5) {
      message.error('Код OTP должен содержать 5 цифр')
      return
    }

    try {
      await verifyOTP(otpCode)
      navigate('/rounds')
    } catch (err) {
      // Ошибка уже обработана в store
    }
  }

  const handleBackToCredentials = () => {
    resetLoginFlow()
  }

  // Если на шаге OTP
  if (loginStep === 'otp') {
    return (
      <div className="mt-[calc(50vh-200px)] flex flex-col border-2 border-blue-500 bg-white">
        <div className="flex justify-center border-b-2 border-green-500 py-3">
          ВВЕДИТЕ КОД ИЗ EMAIL
        </div>
        <div className="flex flex-1 flex-col items-center justify-center p-5">
          <div className="w-[300px] text-center mb-4">
            <p className="text-sm text-gray-600 mb-2">
              Код отправлен на email: <strong>{pendingLoginData?.email}</strong>
            </p>
            <p className="text-xs text-gray-500">
              Код действителен 1 минуту
            </p>
          </div>

          <form onSubmit={handleOTPSubmit} className="w-[300px]">
            <div className="mb-4">
              <Input
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 5))}
                placeholder="12345"
                className="text-center text-2xl font-mono tracking-widest"
                maxLength={5}
                autoFocus
              />
            </div>

            <div className="flex gap-2">
              <Button
                block
                onClick={handleBackToCredentials}
                disabled={isLoading}
              >
                Назад
              </Button>
              <Button
                block
                type="primary"
                htmlType="submit"
                loading={isLoading}
                disabled={otpCode.length !== 5}
              >
                Подтвердить
              </Button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  // Шаг ввода credentials + email
  return (
    <div className="mt-[calc(50vh-200px)] flex flex-col border-2 border-blue-500 bg-white">
      <div className="flex justify-center border-b-2 border-green-500 py-3">ВОЙТИ</div>
      <div className="flex flex-1 flex-col items-center justify-center p-5">
        <Form className="w-[300px]" layout="vertical" requiredMark={false} onFinish={handleCredentialsSubmit}>
          <Form.Item
            label="Имя пользователя:"
            name="username"
            rules={[
              {
                required: true,
                message: 'Пожалуйста, введите имя пользователя',
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Пароль:"
            name="password"
            rules={[
              {
                required: true,
                message: 'Пожалуйста, введите пароль',
              },
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            label="Email для 2FA:"
            name="email"
            rules={[
              {
                required: true,
                message: 'Пожалуйста, введите email',
              },
              {
                type: 'email',
                message: 'Пожалуйста, введите корректный email',
              },
            ]}
          >
            <Input type="email" />
          </Form.Item>
          <Form.Item>
            <Button block type="primary" htmlType="submit" loading={isLoading}>
              Отправить код
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  )
}

export default LoginPage
