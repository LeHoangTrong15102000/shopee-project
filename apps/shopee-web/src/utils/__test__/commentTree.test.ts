import { describe, it, expect } from 'vitest';
import { buildCommentTree } from '../commentTree';

describe('buildCommentTree', () => {
  it('should return empty array for empty input', () => {
    expect(buildCommentTree([])).toEqual([]);
  });

  it('should return root comments when no parents', () => {
    const comments = [
      { _id: '1', content: 'Root 1' },
      { _id: '2', content: 'Root 2' },
    ] as any[];
    const tree = buildCommentTree(comments);
    expect(tree).toHaveLength(2);
    expect(tree[0]._id).toBe('1');
  });

  it('should nest child comments under parents', () => {
    const comments = [
      { _id: '1', content: 'Root' },
      { _id: '2', content: 'Reply', parent_comment: '1' },
    ] as any[];
    const tree = buildCommentTree(comments);
    expect(tree).toHaveLength(1);
    expect(tree[0].replies).toHaveLength(1);
    expect(tree[0].replies![0]._id).toBe('2');
  });

  it('should handle orphan comments (parent not in list)', () => {
    const comments = [{ _id: '1', content: 'Orphan', parent_comment: 'missing' }] as any[];
    const tree = buildCommentTree(comments);
    expect(tree).toHaveLength(1);
  });

  it('should handle deep nesting', () => {
    const comments = [
      { _id: '1', content: 'Root' },
      { _id: '2', content: 'Child', parent_comment: '1' },
      { _id: '3', content: 'Grandchild', parent_comment: '2' },
    ] as any[];
    const tree = buildCommentTree(comments);
    expect(tree).toHaveLength(1);
    expect(tree[0].replies![0].replies![0]._id).toBe('3');
  });
});
