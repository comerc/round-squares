import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/app/store'
import { Form, Input, Button, message } from 'antd'
import { useEffect } from 'react'

function LoginPage() {
  const navigate = useNavigate()
  const { login, verify2fa, isLoading, error, clearError, require2fa, user } = useAuthStore()

  useEffect(() => {
    if (user) {
      navigate('/rounds')
    }
  }, [user, navigate])

  useEffect(() => {
    if (error) {
      message.error(error)
      clearError()
    }
  }, [error, clearError])

  const handleLogin = async (values: { username: string; password: string; email: string }) => {
    try {
      await login(values.username, values.password, values.email)
    } catch (err) {
      // Error handled in store
    }
  }

  const handleVerify = async (values: { code: string }) => {
    try {
      await verify2fa(values.code)
    } catch (err) {
      // Error handled in store
    }
  }

  return (
    <div className="mt-[calc(50vh-200px)] flex flex-col border-2 border-blue-500 bg-white">
      <div className="flex justify-center border-b-2 border-green-500 py-3">
        {require2fa ? 'ВВЕДИТЕ КОД' : 'ВОЙТИ'}
      </div>
      <div className="flex flex-1 flex-col items-center justify-center p-5">
        {!require2fa ? (
          <Form className="w-[300px]" layout="vertical" requiredMark={false} onFinish={handleLogin}>
            <Form.Item
              label="Имя пользователя:"
              name="username"
              rules={[{ required: true, message: 'Пожалуйста, введите имя пользователя' }]}
            >
              <Input />
            </Form.Item>
            <Form.Item
              label="Пароль:"
              name="password"
              rules={[{ required: true, message: 'Пожалуйста, введите пароль' }]}
            >
              <Input.Password />
            </Form.Item>
            <Form.Item
              label="Email (для кода):"
              name="email"
              rules={[
                { required: true, message: 'Пожалуйста, введите email' },
                { type: 'email', message: 'Введите корректный email' },
              ]}
            >
              <Input />
            </Form.Item>
            <Form.Item>
              <Button block type="primary" htmlType="submit" loading={isLoading}>
                Войти
              </Button>
            </Form.Item>
          </Form>
        ) : (
          <Form className="w-[300px]" layout="vertical" requiredMark={false} onFinish={handleVerify}>
            <div className="mb-4 text-center text-gray-600">
              Мы отправили код подтверждения на ваш email.
            </div>
            <Form.Item
              label="Код подтверждения:"
              name="code"
              rules={[
                { required: true, message: 'Пожалуйста, введите код' },
                { len: 6, message: 'Код должен состоять из 6 цифр' },
              ]}
            >
              <Input maxLength={6} className="text-center text-lg tracking-widest" />
            </Form.Item>
            <Form.Item>
              <Button block type="primary" htmlType="submit" loading={isLoading}>
                Подтвердить
              </Button>
            </Form.Item>
          </Form>
        )}
      </div>
    </div>
  )
}

export default LoginPage
