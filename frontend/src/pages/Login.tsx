import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/app/store'
import UserHeader from '@/components/UserHeader'
import { Form, Input, Button, message } from 'antd'
import { useEffect } from 'react'

function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoading, error, clearError } = useAuthStore()

  useEffect(() => {
    if (error) {
      message.error(error)
      clearError()
    }
  }, [error, clearError])

  const handleLogin = async (values: { username: string; password: string }) => {
    try {
      await login(values.username, values.password)
      navigate('/rounds')
    } catch (err) {
      // Ошибка уже обработана в store
    }
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
          <Form.Item>
            <Button block type="primary" htmlType="submit" loading={isLoading}>
              Войти
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  )
}

export default LoginPage
