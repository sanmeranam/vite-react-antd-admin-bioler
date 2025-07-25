import React, { createContext, useContext, useState, useEffect } from 'react'
import { theme } from 'antd'

const ThemeContext = createContext()

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

const defaultThemes = {
  light: {
    token: {
      colorPrimary: '#1890ff',
      colorBgContainer: '#ffffff',
      colorText: '#000000',
      colorTextSecondary: '#666666',
      colorBorder: '#d9d9d9',
      colorBgLayout: '#f5f5f5',
      colorBgHeader: '#ffffff',
      colorTextHeader: '#000000',
      colorBgSidebar: '#ffffff',
      colorTextSidebar: '#000000',
    },
    algorithm: theme.defaultAlgorithm,
  },
  dark: {
    token: {
      colorPrimary: '#1890ff',
      colorBgContainer: '#141414',
      colorText: '#ffffff',
      colorTextSecondary: '#a6a6a6',
      colorBorder: '#434343',
      colorBgLayout: '#000000',
      colorBgHeader: '#001529',
      colorTextHeader: '#ffffff',
      colorBgSidebar: '#001529',
      colorTextSidebar: '#ffffff',
    },
    algorithm: theme.darkAlgorithm,
  },
  compact: {
    token: {
      colorPrimary: '#1890ff',
      colorBgContainer: '#ffffff',
      colorText: '#000000',
      colorTextSecondary: '#666666',
      colorBorder: '#d9d9d9',
      colorBgLayout: '#f5f5f5',
      colorBgHeader: '#ffffff',
      colorTextHeader: '#000000',
      colorBgSidebar: '#ffffff',
      colorTextSidebar: '#000000',
      sizeStep: 3,
      controlHeight: 28,
    },
    algorithm: [theme.defaultAlgorithm, theme.compactAlgorithm],
  },
}

export const ThemeProvider = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('light')
  const [customTheme, setCustomTheme] = useState(null)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    // Load theme from localStorage or tenant settings
    const savedTheme = localStorage.getItem('app-theme')
    if (savedTheme && defaultThemes[savedTheme]) {
      setCurrentTheme(savedTheme)
    }
    
    const savedCollapsed = localStorage.getItem('sidebar-collapsed')
    if (savedCollapsed) {
      setCollapsed(JSON.parse(savedCollapsed))
    }

    // Handle window resize to close mobile menu on desktop
    const handleResize = () => {
      if (window.innerWidth > 768 && mobileMenuOpen) {
        setMobileMenuOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [mobileMenuOpen])

  const switchTheme = (themeName) => {
    setCurrentTheme(themeName)
    localStorage.setItem('app-theme', themeName)
  }

  const updateCustomTheme = (themeConfig) => {
    setCustomTheme(themeConfig)
  }

  const toggleSidebar = () => {
    const newCollapsed = !collapsed
    setCollapsed(newCollapsed)
    localStorage.setItem('sidebar-collapsed', JSON.stringify(newCollapsed))
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  const isMobile = () => {
    return window.innerWidth <= 768
  }

  const getTheme = () => {
    if (customTheme) {
      return customTheme
    }
    return defaultThemes[currentTheme] || defaultThemes.light
  }

  const value = {
    currentTheme,
    switchTheme,
    customTheme,
    updateCustomTheme,
    getTheme,
    collapsed,
    toggleSidebar,
    mobileMenuOpen,
    toggleMobileMenu,
    closeMobileMenu,
    isMobile,
    availableThemes: Object.keys(defaultThemes),
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
} 