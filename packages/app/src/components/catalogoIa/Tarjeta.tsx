import { Entity } from '@backstage/catalog-model';
import { useRouteRef } from '@backstage/core-plugin-api';
import {
  entityRouteRef,
  useStarredEntities,
} from '@backstage/plugin-catalog-react';
import { IconButton, makeStyles, Tooltip } from '@material-ui/core';
import AdbIcon from '@material-ui/icons/Adb';
import BuildIcon from '@material-ui/icons/BuildOutlined';
import ChatIcon from '@material-ui/icons/ChatBubbleOutline';
import DnsIcon from '@material-ui/icons/DnsOutlined';
import PersonIcon from '@material-ui/icons/PersonOutline';
import StarIcon from '@material-ui/icons/Star';
import StarBorderIcon from '@material-ui/icons/StarBorder';
import { ComponentType } from 'react';
import { Link } from 'react-router-dom';
import {
  ETIQUETA_CATEGORIA,
  ETIQUETA_COMPLEJIDAD,
  ETIQUETA_MADUREZ,
  etiquetaDe,
  lifecycleDe,
  nombreDe,
  ownerCorto,
  ownerDe,
  tipoDe,
} from './datos';

const MAX_TAGS = 3;

const ICONOS: Record<string, ComponentType<{ className?: string }>> = {
  mcp: DnsIcon,
  tool: BuildIcon,
  prompt: ChatIcon,
  agent: AdbIcon,
};

const useStyles = makeStyles({
  tarjeta: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    minHeight: 300,
    padding: '18px 20px 20px',
    background: '#FFFFFF',
    borderRadius: 12,
    boxShadow: '0 1px 3px rgba(0,0,0,.08)',
    transition: 'box-shadow .15s',
    '&:hover': { boxShadow: '0 3px 10px rgba(0,0,0,.16)' },
  },
  cabecera: { display: 'flex', alignItems: 'center', gap: 12, minHeight: 40 },
  icono: { color: '#2C2A29', fontSize: 26 },
  nombre: {
    flex: 1,
    fontSize: 20,
    fontWeight: 500,
    lineHeight: 1.25,
    color: '#2C2A29',
    textDecoration: 'none',
    wordBreak: 'break-word',
    // El enlace cubre toda la tarjeta; la estrella queda por encima.
    '&::after': { content: '""', position: 'absolute', inset: 0 },
  },
  estrella: { position: 'relative', zIndex: 1, color: '#8C8C8C' },
  insignias: { display: 'flex', flexWrap: 'wrap', gap: 8, margin: '10px 0' },
  insignia: {
    padding: '3px 10px',
    borderRadius: 4,
    fontSize: 14,
    fontWeight: 500,
  },
  production: { background: '#00C389', color: '#FFFFFF' },
  development: { background: '#FDDA24', color: '#2C2A29' },
  otroLifecycle: { background: '#E0E0E0', color: '#2C2A29' },
  categoria: {
    background: '#E4F6FB',
    color: '#0E8FB5',
    textTransform: 'capitalize',
  },
  complejidad: {
    background: '#FFE9E0',
    color: '#D9541E',
    textTransform: 'capitalize',
  },
  madurez: {
    background: '#E2F7EF',
    color: '#0B9467',
    textTransform: 'capitalize',
  },
  descripcion: {
    margin: 0,
    fontSize: 15,
    lineHeight: 1.55,
    color: '#454545',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  owner: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    fontSize: 15,
    color: '#8C8C8C',
  },
  ownerIcono: { fontSize: 20 },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 'auto',
    paddingTop: 16,
  },
  tag: {
    padding: '6px 11px',
    borderRadius: 6,
    fontSize: 13,
    background: '#EFEFEF',
    color: '#2C2A29',
  },
});

export const Tarjeta = ({ entidad }: { entidad: Entity }) => {
  const classes = useStyles();
  const rutaEntidad = useRouteRef(entityRouteRef);
  const { isStarredEntity, toggleStarredEntity } = useStarredEntities();
  const favorita = isStarredEntity(entidad);
  const tipo = tipoDe(entidad);
  const Icono = ICONOS[tipo];
  const lifecycle = lifecycleDe(entidad);
  const tags = entidad.metadata.tags ?? [];
  const nombre = nombreDe(entidad);
  const ruta = rutaEntidad({
    namespace: entidad.metadata.namespace ?? 'default',
    kind: entidad.kind.toLocaleLowerCase('en-US'),
    name: entidad.metadata.name,
  });
  const claseLifecycle =
    lifecycle === 'production' || lifecycle === 'development'
      ? classes[lifecycle]
      : classes.otroLifecycle;

  return (
    <article className={classes.tarjeta}>
      <div className={classes.cabecera}>
        {Icono && <Icono className={classes.icono} />}
        <Link to={ruta} className={classes.nombre}>
          {nombre}
        </Link>
        <Tooltip title={favorita ? 'Remove from Starred' : 'Add to Starred'}>
          <IconButton
            size="small"
            className={classes.estrella}
            aria-label={`Star ${nombre}`}
            aria-pressed={favorita}
            onClick={() => toggleStarredEntity(entidad)}
          >
            {favorita ? <StarIcon /> : <StarBorderIcon />}
          </IconButton>
        </Tooltip>
      </div>

      <div className={classes.insignias}>
        {tipo === 'skill' ? (
          [
            [ETIQUETA_CATEGORIA, classes.categoria],
            [ETIQUETA_COMPLEJIDAD, classes.complejidad],
            [ETIQUETA_MADUREZ, classes.madurez],
          ].map(([etiqueta, clase]) =>
            etiquetaDe(entidad, etiqueta) ? (
              <span key={etiqueta} className={`${classes.insignia} ${clase}`}>
                {etiquetaDe(entidad, etiqueta)}
              </span>
            ) : null,
          )
        ) : (
          <span className={`${classes.insignia} ${claseLifecycle}`}>
            {lifecycle}
          </span>
        )}
      </div>

      <p className={classes.descripcion}>{entidad.metadata.description}</p>

      <div className={classes.owner}>
        <PersonIcon className={classes.ownerIcono} />
        <span>
          <strong>Owner:</strong> {ownerCorto(ownerDe(entidad))}
        </span>
      </div>

      <div className={classes.tags}>
        {tags.slice(0, MAX_TAGS).map(tag => (
          <span key={tag} className={classes.tag}>
            {tag}
          </span>
        ))}
        {tags.length > MAX_TAGS && (
          <span className={classes.tag}>+{tags.length - MAX_TAGS}</span>
        )}
      </div>
    </article>
  );
};
