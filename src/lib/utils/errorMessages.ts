export function translateAuthError(error: string): { message: string; suggestion?: string; icon?: string } {
  const errorLower = error.toLowerCase()
  
  // Неверные учетные данные
  if (errorLower.includes('invalid login credentials') || 
      errorLower.includes('invalid credentials') ||
      errorLower.includes('email not confirmed')) {
    return {
      message: 'Неверный email или пароль',
      suggestion: 'Проверьте правильность введенных данных или восстановите пароль',
      icon: '🔐'
    }
  }
  
  // Email уже используется
  if (errorLower.includes('user already registered') || 
      errorLower.includes('email already registered')) {
    return {
      message: 'Этот email уже зарегистрирован',
      suggestion: 'Попробуйте войти в систему или восстановить пароль',
      icon: '📧'
    }
  }
  
  // Слабый пароль
  if (errorLower.includes('password') && errorLower.includes('weak')) {
    return {
      message: 'Пароль слишком простой',
      suggestion: 'Используйте минимум 6 символов, включая буквы и цифры',
      icon: '🔒'
    }
  }
  
  // Неверный формат email
  if (errorLower.includes('invalid email') || errorLower.includes('email format')) {
    return {
      message: 'Неверный формат email адреса',
      suggestion: 'Введите корректный email адрес (например: user@example.com)',
      icon: '✉️'
    }
  }
  
  // Слишком много попыток
  if (errorLower.includes('too many requests') || errorLower.includes('rate limit')) {
    return {
      message: 'Слишком много попыток входа',
      suggestion: 'Подождите несколько минут перед следующей попыткой',
      icon: '⏰'
    }
  }
  
  // Проблемы с сетью
  if (errorLower.includes('network') || errorLower.includes('connection')) {
    return {
      message: 'Проблема с подключением',
      suggestion: 'Проверьте интернет-соединение и попробуйте снова',
      icon: '🌐'
    }
  }
  
  // Email не подтвержден
  if (errorLower.includes('email not confirmed') || errorLower.includes('confirm')) {
    return {
      message: 'Email не подтвержден',
      suggestion: 'Проверьте почту и перейдите по ссылке подтверждения',
      icon: '📬'
    }
  }
  
  // Пользователь не найден
  if (errorLower.includes('user not found') || errorLower.includes('no user')) {
    return {
      message: 'Пользователь не найден',
      suggestion: 'Проверьте email или зарегистрируйтесь',
      icon: '👤'
    }
  }
  
  // Сессия истекла
  if (errorLower.includes('session') || errorLower.includes('expired')) {
    return {
      message: 'Сессия истекла',
      suggestion: 'Войдите в систему заново',
      icon: '⏱️'
    }
  }
  
  // Общая ошибка
  return {
    message: 'Произошла ошибка',
    suggestion: 'Попробуйте еще раз или обратитесь в поддержку',
    icon: '⚠️'
  }
}

export function getErrorAnimation(errorType: string): string {
  const errorLower = errorType.toLowerCase()
  
  if (errorLower.includes('credentials') || errorLower.includes('password')) {
    return 'animate-shake' // Тряска для неверных данных
  }
  
  if (errorLower.includes('network') || errorLower.includes('connection')) {
    return 'animate-pulse' // Пульсация для сетевых ошибок
  }
  
  if (errorLower.includes('rate limit') || errorLower.includes('too many')) {
    return 'animate-bounce' // Подпрыгивание для лимитов
  }
  
  return 'animate-fade-in' // Обычное появление
}