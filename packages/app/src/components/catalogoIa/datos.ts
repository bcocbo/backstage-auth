import { Entity } from '@backstage/catalog-model';

export type Pestana = 'mcps' | 'agents' | 'skills';

export const PESTANAS: Pestana[] = ['mcps', 'agents', 'skills'];

export const TIPOS_POR_PESTANA: Record<Pestana, string[]> = {
  mcps: ['mcp', 'tool', 'prompt'],
  agents: ['agent'],
  skills: ['skill'],
};

export const ETIQUETA_CATEGORIA = 'harness.poc/categoria';
export const ETIQUETA_COMPLEJIDAD = 'harness.poc/complejidad';
export const ETIQUETA_MADUREZ = 'harness.poc/madurez';

export type Filtros = {
  texto: string;
  soloFavoritos: boolean;
  tipos: string[];
  owner: string;
  tags: string[];
  categorias: string[];
  complejidades: string[];
  madureces: string[];
};

export const filtrosIniciales = (): Filtros => ({
  texto: '',
  soloFavoritos: false,
  tipos: [...TIPOS_POR_PESTANA.mcps],
  owner: '',
  tags: [],
  categorias: [],
  complejidades: [],
  madureces: [],
});

const normalizar = (texto: string) =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

export const tipoDe = (entidad: Entity) => String(entidad.spec?.type ?? '');
export const ownerDe = (entidad: Entity) => String(entidad.spec?.owner ?? '');
export const lifecycleDe = (entidad: Entity) =>
  String(entidad.spec?.lifecycle ?? '');
export const nombreDe = (entidad: Entity) =>
  entidad.metadata.title ?? entidad.metadata.name;
export const etiquetaDe = (entidad: Entity, etiqueta: string) =>
  entidad.metadata.labels?.[etiqueta] ?? '';

/** "group:default/guests" y "group:guests" se muestran como "guests". */
export const ownerCorto = (owner: string) => owner.replace(/^.*[:/]/, '');

export const valoresUnicos = (valores: string[]) =>
  [...new Set(valores.filter(Boolean))].sort((a, b) => a.localeCompare(b));

const incluyeONoFiltra = (seleccion: string[], valor: string) =>
  seleccion.length === 0 || seleccion.includes(valor);

export const aplicarFiltros = (
  entidades: Entity[],
  pestana: Pestana,
  filtros: Filtros,
  esFavorita: (entidad: Entity) => boolean,
) => {
  const texto = normalizar(filtros.texto.trim());
  return entidades.filter(entidad => {
    if (filtros.soloFavoritos && !esFavorita(entidad)) return false;
    if (texto) {
      const contenido = normalizar(
        [
          entidad.metadata.name,
          entidad.metadata.title,
          entidad.metadata.description,
          ...(entidad.metadata.tags ?? []),
        ].join(' '),
      );
      if (!contenido.includes(texto)) return false;
    }
    if (filtros.owner && ownerDe(entidad) !== filtros.owner) return false;
    if (pestana === 'mcps' && !filtros.tipos.includes(tipoDe(entidad))) {
      return false;
    }
    if (pestana === 'agents') {
      const tags = entidad.metadata.tags ?? [];
      if (filtros.tags.length && !filtros.tags.some(t => tags.includes(t))) {
        return false;
      }
    }
    if (pestana === 'skills') {
      return (
        incluyeONoFiltra(
          filtros.categorias,
          etiquetaDe(entidad, ETIQUETA_CATEGORIA),
        ) &&
        incluyeONoFiltra(
          filtros.complejidades,
          etiquetaDe(entidad, ETIQUETA_COMPLEJIDAD),
        ) &&
        incluyeONoFiltra(
          filtros.madureces,
          etiquetaDe(entidad, ETIQUETA_MADUREZ),
        )
      );
    }
    return true;
  });
};
