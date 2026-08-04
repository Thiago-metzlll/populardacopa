import { act, renderHook, waitFor } from '@testing-library/react-native';
import { Group } from '../../domain/entities/Group';
import { makeGetAllGroups } from '../../main/factories/makeGetAllGroups';
import { useGroups } from './useGroups';

jest.mock('../../main/factories/makeGetAllGroups', () => ({
  makeGetAllGroups: jest.fn(),
}));

const execute = jest.fn();

const groups: Group[] = [
  { id: 'g1', name: 'Grupo A', teamIds: ['bra', 'arg'], standings: [] },
  { id: 'g2', name: 'Grupo B', teamIds: ['ger', 'fra'], standings: [] },
];

beforeEach(() => {
  jest.clearAllMocks();
  (makeGetAllGroups as jest.Mock).mockReturnValue({ execute });
  execute.mockResolvedValue(groups);
});

describe('useGroups', () => {
  it('busca todos os grupos ao montar, sem depender de usuário', async () => {
    const { result } = renderHook(() => useGroups());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(execute).toHaveBeenCalledTimes(1);
    expect(result.current.groups).toEqual(groups);
    expect(result.current.error).toBeNull();
  });

  it('começa com lista vazia em loading', async () => {
    const { result } = renderHook(() => useGroups());

    expect(result.current.groups).toEqual([]);
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));
  });

  it('guarda o erro quando a busca falha', async () => {
    execute.mockRejectedValue(new Error('SQLite indisponível'));

    const { result } = renderHook(() => useGroups());

    await waitFor(() => expect(result.current.error).toBe('SQLite indisponível'));
    expect(result.current.loading).toBe(false);
    expect(result.current.groups).toEqual([]);
  });

  it('busca apenas uma vez ao montar', async () => {
    const { result } = renderHook(() => useGroups());
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('refetch busca de novo e atualiza a lista', async () => {
    const { result } = renderHook(() => useGroups());
    await waitFor(() => expect(result.current.loading).toBe(false));

    const atualizados: Group[] = [{ id: 'g3', name: 'Grupo C', teamIds: [], standings: [] }];
    execute.mockResolvedValue(atualizados);

    await act(async () => {
      await result.current.refetch();
    });

    expect(execute).toHaveBeenCalledTimes(2);
    expect(result.current.groups).toEqual(atualizados);
    expect(result.current.refreshing).toBe(false);
  });

  it('refetch limpa o erro anterior quando a nova busca dá certo', async () => {
    execute.mockRejectedValueOnce(new Error('SQLite indisponível'));

    const { result } = renderHook(() => useGroups());
    await waitFor(() => expect(result.current.error).toBe('SQLite indisponível'));

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.groups).toEqual(groups);
  });
});
