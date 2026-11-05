import { Entity } from '@backstage/catalog-model';
import {
  Content,
  Header,
  Page,
  Progress,
  ResponseErrorPanel,
} from '@backstage/core-components';
import { useApi } from '@backstage/core-plugin-api';
import {
  catalogApiRef,
  useStarredEntities,
} from '@backstage/plugin-catalog-react';
import { makeStyles } from '@material-ui/core';
import AdbIcon from '@material-ui/icons/Adb';
import BubbleChartIcon from '@material-ui/icons/BubbleChart';
import DnsIcon from '@material-ui/icons/DnsOutlined';
import PersonIcon from '@material-ui/icons/PersonOutline';
import SchoolIcon from '@material-ui/icons/SchoolOutlined';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AMARILLO, OSCURO } from '../../theme';
import {
  aplicarFiltros,
  Filtros,
  filtrosIniciales,
  nombreDe,
  Pestana,
  PESTANAS,
  tipoDe,
  TIPOS_POR_PESTANA,
} from './datos';
import { PanelFiltros } from './PanelFiltros';
import { Tarjeta } from './Tarjeta';

const PESTANA_INFO = {
  mcps: {
    etiqueta: 'MCPS',
    titulo: 'All Resources',
    Icono: DnsIcon,
    IconoTitulo: DnsIcon,
  },
  agents: {
    etiqueta: 'AGENTS',
    titulo: 'Agents',
    Icono: PersonIcon,
    IconoTitulo: AdbIcon,
  },
  skills: {
    etiqueta: 'SKILLS',
    titulo: 'Skills',
    Icono: SchoolIcon,
    IconoTitulo: SchoolIcon,
  },
};

const useStyles = makeStyles({
  // Cancela el relleno de Content para que la franja blanca llegue a los bordes.
  categoria: {
    display: 'flex',
    margin: '-24px -24px 24px',
    padding: '0 24px',
    background: '#FFFFFF',
    borderBottom: '1px solid #DDDDDD',
  },
  categoriaActiva: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    width: 190,
    padding: '18px 0 14px',
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: '.03em',
    color: OSCURO,
    borderBottom: `3px solid ${OSCURO}`,
  },
  pestanas: {
    display: 'flex',
    gap: 8,
    marginBottom: 24,
    padding: '8px 24px',
    background: '#EFEFEF',
    borderTop: '2px solid #E5E5E5',
    borderBottom: '2px solid #E5E5E5',
  },
  pestana: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 10px',
    border: '2px solid transparent',
    borderRadius: 4,
    background: 'transparent',
    color: OSCURO,
    font: 'inherit',
    fontSize: 16,
    fontWeight: 700,
    cursor: 'pointer',
  },
  pestanaActiva: { borderColor: OSCURO },
  cuerpo: {
    display: 'grid',
    gridTemplateColumns: '300px minmax(0, 1fr)',
    gap: 24,
    alignItems: 'start',
  },
  encabezado: {
    display: 'flex',
    alignItems: 'center',
    gap: 20,
    marginBottom: 24,
    padding: '20px 32px',
    background: '#FAFAFA',
  },
  iconoTitulo: { fontSize: 40, color: AMARILLO },
  titulo: { margin: 0, fontSize: 40, fontWeight: 500, color: OSCURO },
  rejilla: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 24,
    padding: '0 32px',
    '@media (max-width: 1100px)': { gridTemplateColumns: 'minmax(0, 1fr)' },
  },
  vacio: { padding: 32, fontSize: 16, color: '#6F6F6F' },
});

const pestanaValida = (valor: string | null): Pestana =>
  PESTANAS.includes(valor as Pestana) ? (valor as Pestana) : 'mcps';

export const CatalogoIaPage = () => {
  const classes = useStyles();
  const catalogApi = useApi(catalogApiRef);
  const { isStarredEntity } = useStarredEntities();
  const [params, setParams] = useSearchParams();
  const pestana = pestanaValida(params.get('tab'));
  const info = PESTANA_INFO[pestana];
  const [entidades, setEntidades] = useState<Entity[]>();
  const [error, setError] = useState<Error>();
  const [filtrosPorPestana, setFiltrosPorPestana] = useState<
    Record<Pestana, Filtros>
  >({
    mcps: filtrosIniciales(),
    agents: filtrosIniciales(),
    skills: filtrosIniciales(),
  });
  const filtros = filtrosPorPestana[pestana];

  useEffect(() => {
    let vigente = true;
    catalogApi
      .getEntities({
        filter: {
          kind: 'Component',
          'spec.type': Object.values(TIPOS_POR_PESTANA).flat(),
        },
      })
      .then(({ items }) => {
        if (vigente) setEntidades(items);
      })
      .catch(e => {
        if (vigente) setError(e);
      });
    return () => {
      vigente = false;
    };
  }, [catalogApi]);

  const dePestana = useMemo(
    () =>
      (entidades ?? [])
        .filter(e => TIPOS_POR_PESTANA[pestana].includes(tipoDe(e)))
        .sort((a, b) => nombreDe(a).localeCompare(nombreDe(b))),
    [entidades, pestana],
  );
  const visibles = aplicarFiltros(dePestana, pestana, filtros, isStarredEntity);

  const cambiar = (cambio: Partial<Filtros>) =>
    setFiltrosPorPestana(actual => ({
      ...actual,
      [pestana]: { ...actual[pestana], ...cambio },
    }));

  return (
    <Page themeId="home">
      <Header
        title="Catalog"
        subtitle="Browse and discover all components in the Backstage PoC ecosystem"
      />
      <Content>
        <div className={classes.categoria}>
          <div className={classes.categoriaActiva} aria-current="page">
            <BubbleChartIcon />
            CATALOG IA
          </div>
        </div>

        <div className={classes.pestanas} role="tablist">
          {PESTANAS.map(id => {
            const { etiqueta, Icono } = PESTANA_INFO[id];
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={id === pestana}
                className={`${classes.pestana} ${
                  id === pestana ? classes.pestanaActiva : ''
                }`}
                onClick={() => setParams({ tab: id })}
              >
                <Icono />
                {etiqueta}
              </button>
            );
          })}
        </div>

        {error && <ResponseErrorPanel error={error} />}
        {!error && !entidades && <Progress />}
        {!error && entidades && (
          <div className={classes.cuerpo}>
            <PanelFiltros
              pestana={pestana}
              entidades={dePestana}
              numeroFavoritas={dePestana.filter(isStarredEntity).length}
              filtros={filtros}
              cambiar={cambiar}
            />
            <div>
              <div className={classes.encabezado}>
                <info.IconoTitulo className={classes.iconoTitulo} />
                <h2 className={classes.titulo}>
                  {info.titulo} ({visibles.length})
                </h2>
              </div>
              {visibles.length ? (
                <div className={classes.rejilla}>
                  {visibles.map(entidad => (
                    <Tarjeta key={entidad.metadata.uid} entidad={entidad} />
                  ))}
                </div>
              ) : (
                <div className={classes.vacio}>
                  No resources match these filters.
                </div>
              )}
            </div>
          </div>
        )}
      </Content>
    </Page>
  );
};
