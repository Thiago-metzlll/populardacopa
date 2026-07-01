import { Group } from '../entities/Group';
import { GroupRepository } from '../repositories/GroupRepository';

export class GetAllGroups {
  constructor(private readonly groupRepository: GroupRepository) {}

  async execute(): Promise<Group[]> {
    return this.groupRepository.getAllGroups();
  }
}
