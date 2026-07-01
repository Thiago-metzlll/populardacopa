import { Group } from '../entities/Group';

export interface GroupRepository {
  getAllGroups(): Promise<Group[]>;
  getGroupById(id: string): Promise<Group>;
}
