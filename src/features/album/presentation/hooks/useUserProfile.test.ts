import { act, renderHook, waitFor } from '@testing-library/react-native';
import { makeSticker, makeUser } from '../../../../../test/fixtures';
import { useCurrentUser } from '../../../../shared/presentation/contexts/UserContext';
import { UserProfileResult } from '../../domain/usecases/GetUserProfile';
import { makeGetUserProfile } from '../../main/factories/makeGetUserProfile';
import { useUserProfile } from './useUserProfile';

jest.mock('../../../../shared/presentation/contexts/UserContext', () => ({
  useCurrentUser: jest.fn(),
}));
jest.mock('../../main/factories/makeGetUserProfile', () => ({
  makeGetUserProfile: jest.fn(),
}));

const execute = jest.fn();

const profile: UserProfileResult = {
  collection: { userId: 'u1', albumId: 'a1', stickerIds: ['s1'], progress: 1 },
  stickers: [makeSticker({ id: 's1' })],
  recentStickers: [makeSticker({ id: 's1' })],
  rareStickers: [],
};

beforeEach(() => {
  jest.clearAllMocks();
  (makeGetUserProfile as jest.Mock).mockReturnValue({ execute });
  (useCurrentUser as jest.Mock).mockReturnValue(makeUser());
  execute.mockResolvedValue(profile);
});

describe('useUserProfile', () => {
  it('busca o perfil do usuário atual ao montar', async () => {
    const { result } = renderHook(() => useUserProfile());

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(execute).toHaveBeenCalledWith('u1');
    expect(result.current.profile).toEqual(profile);
    expect(result.current.error).toBeNull();
  });

  it('não busca nada quando não há usuário autenticado', async () => {
    (useCurrentUser as jest.Mock).mockReturnValue(null);

    const { result } = renderHook(() => useUserProfile());

    await waitFor(() => expect(execute).not.toHaveBeenCalled());
    expect(result.current.profile).toBeNull();
  });

  it('guarda a mensagem de erro quando a busca falha', async () => {
    execute.mockRejectedValue(new Error('Firestore indisponível'));

    const { result } = renderHook(() => useUserProfile());

    await waitFor(() => expect(result.current.error).toBe('Firestore indisponível'));
    expect(result.current.loading).toBe(false);
    expect(result.current.profile).toBeNull();
  });

  it('refetch busca o perfil novamente', async () => {
    const { result } = renderHook(() => useUserProfile());
    await waitFor(() => expect(result.current.loading).toBe(false));

    execute.mockResolvedValue({ ...profile, rareStickers: [makeSticker({ id: 's9', rarity: 'lendaria' })] });
    await act(async () => {
      await result.current.refetch();
    });

    expect(execute).toHaveBeenCalledTimes(2);
    expect(result.current.profile?.rareStickers).toHaveLength(1);
  });

  it('rebusca quando o usuário muda de identidade', async () => {
    const { result, rerender } = renderHook(() => useUserProfile());
    await waitFor(() => expect(execute).toHaveBeenCalledWith('u1'));

    (useCurrentUser as jest.Mock).mockReturnValue(makeUser({ id: 'u2' }));
    rerender(undefined);

    await waitFor(() => expect(execute).toHaveBeenCalledWith('u2'));
    expect(result.current.error).toBeNull();
  });
});
