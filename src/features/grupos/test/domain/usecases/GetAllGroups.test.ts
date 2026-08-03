import { GetAllGroups } from '../../../domain/usecases/GetAllGroups';
import { GroupRepository } from '../../../domain/repositories/GroupRepository';
import { Group } from '../../../domain/entities/Group';

describe('GetAllGroups', () => {
  it('delega a busca de todos os grupos para o repositório e retorna o resultado', async () => {
    const expected: Group[] = [{ id: 'a', name: 'Grupo A', teamIds: [], standings: [] }];
    const groupRepository = {
      getAllGroups: jest.fn(async () => expected),
    } as unknown as GroupRepository;
    const sut = new GetAllGroups(groupRepository);

    const result = await sut.execute();

    expect(groupRepository.getAllGroups).toHaveBeenCalledTimes(1);
    expect(result).toBe(expected);
  });
});
