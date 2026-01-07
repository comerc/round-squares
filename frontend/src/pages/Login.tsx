import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/app/store'
import UserHeader from '@/components/UserHeader'
import { Form, Input, Button, message } from 'antd'
import { useEffect, useState } from 'react'

function LoginPage() {
  const navigate = useNavigate()
  const { sendOtp, verifyOtp, isLoading, error, clearError, otpSent } = useAuthStore()
  const [form] = Form.useForm()
  const [credentials, setCredentials] = useState<{ username: string; email: string; password: string } | null>(null)

  useEffect(() => {
    if (error) {
      message.error(error)
      clearError()
    }
  }, [error, clearError])

  const handleSendOtp = async (values: { username: string; email: string; password: string }) => {
    try {
      await sendOtp(values.username, values.email, values.password)
      setCredentials(values)
      message.success('OTP отправлен на email')
    } catch (err) {
      // Ошибка уже обработана в store
    }
  }

  const handleVerifyOtp = async (values: { otp: string }) => {
    if (!credentials) return

    try {
      await verifyOtp(credentials.username, credentials.email, values.otp)
      navigate('/rounds')
    } catch (err) {
      // Ошибка уже обработана в store
    }
  }

  return (
    <div className="mt-[calc(50vh-200px)] flex flex-col border-2 border-blue-500 bg-white">
      <div className="flex justify-center border-b-2 border-green-500 py-3">ВОЙТИ</div>
      <div className="flex flex-1 flex-col items-center justify-center p-5">
        {!otpSent ? (
          <Form
            form={form}
            className="w-[300px]"
            layout="vertical"
            requiredMark={false}
            onFinish={handleSendOtp}
          >
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
              label="Email для OTP:"
              name="email"
              rules={[
                {
                  required: true,
                  message: 'Пожалуйста, введите email',
                },
                {
                  type: 'email',
                  message: 'Неверный формат email',
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
            <Form.Item>
              <Button block type="primary" htmlType="submit" loading={isLoading}>
                Отправить код
              </Button>
            </Form.Item>
          </Form>
        ) : (
          <Form
            className="w-[300px]"
            layout="vertical"
            requiredMark={false}
            onFinish={handleVerifyOtp}
          >
            <div className="mb-4 text-center">
              <p className="text-sm text-gray-600">OTP отправлен на {credentials?.email}</p>
              <p className="text-xs text-gray-500">Код действителен 5 минут</p>
            </div>
            <Form.Item
              label="OTP код:"
              name="otp"
              rules={[
                {
                  required: true,
                  message: 'Пожалуйста, введите OTP код',
                },
                {
                  pattern: /^\d{6}$/,
                  message: 'OTP должен содержать 6 цифр',
                },
              ]}
            >
              <Input maxLength={6} />
            </Form.Item>
            <Form.Item>
              <Button block type="primary" htmlType="submit" loading={isLoading}>
                Войти
              </Button>
            </Form.Item>
            <Form.Item>
              <Button
                block
                type="link"
                onClick={() => {
                  setCredentials(null)
                  form.resetFields()
                }}
              >
                Отправить код повторно
              </Button>
            </Form.Item>
          </Form>
        )}
      </div>
    </div>
  )
}

export default LoginPage
