import {
  createBaseThemeOptions,
  createUnifiedTheme,
  genPageTheme,
  palettes,
  pageTheme,
} from '@backstage/theme';

export const AMARILLO = '#FDDA24';
export const OSCURO = '#2C2A29';

// Cabecera oscura y plana en todas las páginas.
const cabeceraOscura = genPageTheme({
  colors: [OSCURO, OSCURO],
  shape: 'none',
});

export const temaCatalogoIa = createUnifiedTheme({
  ...createBaseThemeOptions({
    palette: {
      ...palettes.light,
      primary: { main: OSCURO },
      background: { default: '#F4F4F4', paper: '#FFFFFF' },
      navigation: {
        background: '#FFFFFF',
        indicator: AMARILLO,
        color: OSCURO,
        selectedColor: OSCURO,
        navItem: { hoverBackground: '#F2F2F2' },
        submenu: { background: '#FFFFFF' },
      },
    },
  }),
  pageTheme: Object.fromEntries(
    Object.keys(pageTheme).map(id => [id, cabeceraOscura]),
  ),
  defaultPageTheme: 'home',
  components: {
    BackstageSidebarItem: {
      styleOverrides: {
        selected: {
          backgroundColor: `${AMARILLO} !important`,
          borderLeft: 'none !important',
        },
        label: { fontSize: 16, fontWeight: 400 },
      },
    },
  },
} as Parameters<typeof createUnifiedTheme>[0]);
