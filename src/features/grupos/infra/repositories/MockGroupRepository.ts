import { Group } from '../../domain/entities/Group';
import { GroupRepository } from '../../domain/repositories/GroupRepository';
import { mockGroups } from '../seed/GroupSeed';

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

export class MockGroupRepository implements GroupRepository {
  async getAllGroups(): Promise<Group[]> {
    await delay(400);
    return mockGroups;
  }

  async getGroupById(id: string): Promise<Group> {
    await delay(300);
    const group = mockGroups.find((g) => g.id === id);
    if (!group) throw new Error('Group not found');
    return group;
  }
}
