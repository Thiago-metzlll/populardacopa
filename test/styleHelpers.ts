import { StyleSheet } from 'react-native';

type AnyNode = {
  type?: string;
  props?: Record<string, any>;
  children?: AnyNode[] | null;
} | null;

/**
 * Helpers para asserções sobre estilo condicional em componentes visuais.
 * Evita adicionar testID de produção só para teste: percorre a árvore
 * renderizada (render(...).toJSON()) e achata os estilos de cada nó.
 */
export function flattenStyle(style: unknown): Record<string, any> {
  return (StyleSheet.flatten(style as any) as Record<string, any>) ?? {};
}

/** Estilos achatados de todos os nós da árvore, em ordem de renderização. */
export function collectStyles(node: AnyNode | AnyNode[]): Record<string, any>[] {
  if (!node) return [];
  if (Array.isArray(node)) return node.flatMap(collectStyles);

  const own = node.props?.style ? [flattenStyle(node.props.style)] : [];
  return [...own, ...collectStyles(node.children ?? null)];
}

/** true se algum nó da árvore tem a propriedade de estilo com o valor esperado. */
export function hasStyle(node: AnyNode | AnyNode[], property: string, value: unknown): boolean {
  return collectStyles(node).some((style) => style[property] === value);
}

/** Props de todos os nós de um determinado tipo (ex.: 'RNSVGSvgView', 'Image'). */
export function collectProps(node: AnyNode | AnyNode[], type: string): Record<string, any>[] {
  if (!node) return [];
  if (Array.isArray(node)) return node.flatMap((child) => collectProps(child, type));

  const own = node.type === type && node.props ? [node.props] : [];
  return [...own, ...collectProps(node.children ?? null, type)];
}
