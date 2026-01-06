import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/app/store'
import { Form, Input, Button, message, Typography } from 'antd'
import { useEffect, useState } from 'react'

const { Title, Text } = Typography

function LoginPage() {
  const navigate = useNavigate()
  const { login, verifyOtp, isOtpSent, isLoading, error, clearError } = useAuthStore()
  const [username, setUsername] = useState('')

  useEffect(() => {
    if (error) {
      message.error(error)
      clearError()
    }
  }, [error, clearError])

  const handleLogin = async (values: { username: string; password: string; email: string }) => {
    try {
      setUsername(values.username)
      await login(values.username, values.password, values.email)
    } catch (err) {
      // Ошибка уже обработана в store
    }
  }

  const handleVerifyOtp = async (values: { otp: string }) => {
    try {
      await verifyOtp(username, values.otp)
      navigate('/rounds')
    } catch (err) {
      // Ошибка уже обработана в store
    }
  }

  if (isOtpSent) {
    return (
      <div className="mt-[calc(50vh-200px)] flex flex-col items-center justify-center">
        <div className="flex w-[300px] flex-col border-2 border-blue-500 bg-white">
          <div className="flex justify-center border-b-2 border-green-500 py-3">
            ВВЕДИТЕ КОД
          </div>
          <div className="flex flex-1 flex-col items-center justify-center p-5">
            <Text className="mb-4 text-center">
              Код подтверждения отправлен на ваш email. Он действителен 1 минуту.
            </Text>
            <Form
              className="w-full"
              layout="vertical"
              requiredMark={false}
              onFinish={handleVerifyOtp}
            >
              <Form.Item
                label="Код из письма:"
                name="otp"
                rules={[
                  { required: true, message: 'Введите код' },
                  { len: 6, message: 'Код должен быть 6 цифр' },
                ]}
              >
                <Input maxLength={6} placeholder="123456" className="text-center text-lg tracking-widest" />
              </Form.Item>
              <Form.Item>
                <Button block type="primary" htmlType="submit" loading={isLoading}>
                  Подтвердить
                </Button>
              </Form.Item>
            </Form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mt-[calc(50vh-200px)] flex flex-col border-2 border-blue-500 bg-white">
      <div className="flex justify-center border-b-2 border-green-500 py-3">ВОЙТИ</div>
      <div className="flex flex-1 flex-col items-center justify-center p-5">
        <Form className="w-[300px]" layout="vertical" requiredMark={false} onFinish={handleLogin}>
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
            label="Email (для 2FA):"
            name="email"
            rules={[
              {
                required: true,
                message: 'Пожалуйста, введите email',
              },
              {
                type: 'email',
                message: 'Введите корректный email',
              },
            ]}
          >
            <Input placeholder="mail@example.com" />
          </Form.Item>
          <Form.Item>
            <Button block type="primary" htmlType="submit" loading={isLoading}>
              Продолжить
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  )
}

export default LoginPage
