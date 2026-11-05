import { Entity } from '@backstage/catalog-model';
import {
  Checkbox,
  FormControlLabel,
  InputBase,
  makeStyles,
  MenuItem,
  Select,
} from '@material-ui/core';
import PersonIcon from '@material-ui/icons/PersonOutline';
import SearchIcon from '@material-ui/icons/Search';
import StarBorderIcon from '@material-ui/icons/StarBorder';
import { ReactNode } from 'react';
import { AMARILLO } from '../../theme';
import {
  ETIQUETA_CATEGORIA,
  ETIQUETA_COMPLEJIDAD,
  ETIQUETA_MADUREZ,
  etiquetaDe,
  Filtros,
  ownerCorto,
  ownerDe,
  Pestana,
  valoresUnicos,
} from './datos';

const useStyles = makeStyles({
  panel: {
    padding: '20px 20px 24px',
    background: '#FFFFFF',
  },
  busqueda: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    height: 44,
    padding: '0 12px',
    borderRadius: 6,
    background: '#F1F1F1',
  },
  titulo: {
    margin: '22px 0 8px',
    fontSize: 14,
    fontWeight: 500,
    letterSpacing: '.08em',
    color: '#6F6F6F',
  },
  tipos: { display: 'grid', gridTemplateColumns: '1fr 1fr' },
  fila: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    height: 48,
    padding: '0 16px',
    border: 0,
    borderRadius: 10,
    background: 'transparent',
    color: '#2C2A29',
    font: 'inherit',
    fontSize: 16,
    cursor: 'pointer',
  },
  filaActiva: { background: AMARILLO },
  conteo: { marginLeft: 'auto' },
  select: {
    width: '100%',
    height: 44,
    padding: '0 12px',
    borderRadius: 6,
    background: '#F1F1F1',
    fontSize: 16,
  },
});

const Seccion = ({
  titulo,
  children,
}: {
  titulo: string;
  children: ReactNode;
}) => {
  const classes = useStyles();
  return (
    <>
      <h3 className={classes.titulo}>{titulo}</h3>
      {children}
    </>
  );
};

const Multiple = ({
  titulo,
  vacio,
  opciones,
  valor,
  onChange,
}: {
  titulo: string;
  vacio: string;
  opciones: string[];
  valor: string[];
  onChange: (valor: string[]) => void;
}) => {
  const classes = useStyles();
  return (
    <Seccion titulo={titulo}>
      <Select
        multiple
        displayEmpty
        disableUnderline
        className={classes.select}
        value={valor}
        inputProps={{ 'aria-label': titulo }}
        onChange={e => onChange(e.target.value as string[])}
        renderValue={v => (v as string[]).join(', ') || vacio}
      >
        {opciones.map(opcion => (
          <MenuItem key={opcion} value={opcion}>
            <Checkbox size="small" checked={valor.includes(opcion)} />
            {opcion}
          </MenuItem>
        ))}
      </Select>
    </Seccion>
  );
};

export const PanelFiltros = ({
  pestana,
  entidades,
  numeroFavoritas,
  filtros,
  cambiar,
}: {
  pestana: Pestana;
  entidades: Entity[];
  numeroFavoritas: number;
  filtros: Filtros;
  cambiar: (cambio: Partial<Filtros>) => void;
}) => {
  const classes = useStyles();
  const fila = (soloFavoritos: boolean, contenido: ReactNode, conteo: number) => (
    <button
      type="button"
      className={`${classes.fila} ${
        filtros.soloFavoritos === soloFavoritos ? classes.filaActiva : ''
      }`}
      aria-pressed={filtros.soloFavoritos === soloFavoritos}
      onClick={() => cambiar({ soloFavoritos })}
    >
      {contenido}
      <span className={classes.conteo}>{conteo}</span>
    </button>
  );
  const filaFavoritos = fila(
    true,
    <>
      <StarBorderIcon />
      Starred
    </>,
    numeroFavoritas,
  );
  const filaTodos = fila(
    false,
    <>
      <PersonIcon />
      {pestana === 'skills' ? 'All Skills' : 'All'}
    </>,
    entidades.length,
  );

  return (
    <aside className={classes.panel} aria-label="Filters">
      <label className={classes.busqueda}>
        <SearchIcon />
        <InputBase
          fullWidth
          placeholder={
            pestana === 'skills' ? 'Search AI resources...' : 'Search...'
          }
          inputProps={{ 'aria-label': 'Search' }}
          value={filtros.texto}
          onChange={e => cambiar({ texto: e.target.value })}
        />
      </label>

      {pestana === 'mcps' && (
        <Seccion titulo="TYPE">
          <div className={classes.tipos}>
            {[
              ['mcp', 'MCPs'],
              ['tool', 'Tools'],
              ['prompt', 'Prompts'],
            ].map(([tipo, etiqueta]) => (
              <FormControlLabel
                key={tipo}
                label={etiqueta}
                control={
                  <Checkbox
                    size="small"
                    style={{ color: '#1976D2' }}
                    checked={filtros.tipos.includes(tipo)}
                    onChange={(_, marcado) =>
                      cambiar({
                        tipos: marcado
                          ? [...filtros.tipos, tipo]
                          : filtros.tipos.filter(t => t !== tipo),
                      })
                    }
                  />
                }
              />
            ))}
          </div>
        </Seccion>
      )}

      {pestana === 'skills' ? (
        <Seccion titulo="PERSONAL">
          {filaFavoritos}
          {filaTodos}
        </Seccion>
      ) : (
        <>
          <Seccion titulo="PERSONAL">{filaFavoritos}</Seccion>
          <Seccion titulo="BACKSTAGE POC">{filaTodos}</Seccion>
        </>
      )}

      {pestana !== 'skills' && (
        <Seccion titulo="OWNER">
          <Select
            displayEmpty
            disableUnderline
            className={classes.select}
            value={filtros.owner}
            inputProps={{ 'aria-label': 'Owner' }}
            onChange={e => cambiar({ owner: e.target.value as string })}
            renderValue={v => (v ? ownerCorto(v as string) : 'Select an owner')}
          >
            <MenuItem value="">All owners</MenuItem>
            {valoresUnicos(entidades.map(ownerDe)).map(owner => (
              <MenuItem key={owner} value={owner}>
                {ownerCorto(owner)}
              </MenuItem>
            ))}
          </Select>
        </Seccion>
      )}

      {pestana === 'agents' && (
        <Multiple
          titulo="TAGS"
          vacio="Filter by tags"
          opciones={valoresUnicos(entidades.flatMap(e => e.metadata.tags ?? []))}
          valor={filtros.tags}
          onChange={tags => cambiar({ tags })}
        />
      )}

      {pestana === 'skills' && (
        <>
          <Multiple
            titulo="CATEGORY"
            vacio="Select categories"
            opciones={valoresUnicos(
              entidades.map(e => etiquetaDe(e, ETIQUETA_CATEGORIA)),
            )}
            valor={filtros.categorias}
            onChange={categorias => cambiar({ categorias })}
          />
          <Multiple
            titulo="COMPLEXITY"
            vacio="Select complexity"
            opciones={valoresUnicos(
              entidades.map(e => etiquetaDe(e, ETIQUETA_COMPLEJIDAD)),
            )}
            valor={filtros.complejidades}
            onChange={complejidades => cambiar({ complejidades })}
          />
          <Multiple
            titulo="MATURITY"
            vacio="Select maturity"
            opciones={valoresUnicos(
              entidades.map(e => etiquetaDe(e, ETIQUETA_MADUREZ)),
            )}
            valor={filtros.madureces}
            onChange={madureces => cambiar({ madureces })}
          />
        </>
      )}
    </aside>
  );
};
