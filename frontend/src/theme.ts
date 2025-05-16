import { createTheme } from '@mui/material'

export const colors = {
  background: {
    default: '#121212',
    paper: '#1e1e1e',
    input: '#3A3838',
    hover: '#48A14CFF',
    overlay: '#000000B3'
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#AAAAAA',
    lightOpacity: '#FFFFFF1A'
  },
  primary: {
    main: '#6edb73',
    dark: '#6edb73',
  },
  success: {
    main: '#2A952FFF',
    light: '#2A952FFF',
  },
  error: {
    main: '#DE3C31',
    light: '#DE3C31',
  },
  gray: {
    dark: '#333333',
    medium: '#444444'
  },
  gold: '#FFD700'
}

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
}

export const typography = {
  sizes: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    md: '1rem',       // 16px
    lg: '1.25rem',    // 20px
    xl: '1.5rem',     // 24px
  }
}

export const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: colors.background.default,
      paper: colors.background.paper,
    },
    text: {
      primary: colors.text.primary,
      secondary: colors.text.secondary,
    },
    primary: {
      main: colors.primary.main,
      dark: colors.primary.dark,
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontSize: typography.sizes.xl,
    },
    h6: {
      fontSize: typography.sizes.lg,
    },
    body1: {
      fontSize: typography.sizes.md,
    },
    body2: {
      fontSize: typography.sizes.sm,
    },
    caption: {
      fontSize: typography.sizes.xs,
    }
  },
  components: {
    MuiSelect: {
      styleOverrides: {
        root: {
          fontSize: typography.sizes.xs,
          backgroundColor: colors.background.input,
          '&:hover': {
            backgroundColor: colors.background.paper,
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiInputBase-root': {
            fontSize: typography.sizes.xs,
            backgroundColor: colors.background.input,
            '&:hover': {
              backgroundColor: colors.background.paper,
            },
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: colors.primary.main,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          fontSize: typography.sizes.sm,
          textTransform: 'none',
          padding: `${spacing.sm} ${spacing.md}`,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          color: colors.text.primary,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontSize: typography.sizes.xs,
          '& .MuiTab-iconWrapper': {
            '& > svg': {  // Target Lucide icons
              width: '16px',
              height: '16px'
            }
          }
        }
      }
    }
  }
})
