import { ReviewComment } from 'src/types/review.type'

/**
 * Build comment tree from flat array
 * API trả về flat array, FE rebuild thành tree structure
 * Mỗi root comment (parent_comment === undefined/null) sẽ có replies[] chứa các child comments
 */
export function buildCommentTree(flatComments: ReviewComment[]): ReviewComment[] {
  const commentMap = new Map<string, ReviewComment>()
  const roots: ReviewComment[] = []

  // First pass: index all comments by _id
  for (const comment of flatComments) {
    commentMap.set(comment._id, { ...comment, replies: [] })
  }

  // Second pass: attach children to parents
  for (const comment of flatComments) {
    const node = commentMap.get(comment._id)!
    if (comment.parent_comment) {
      const parent = commentMap.get(comment.parent_comment)
      if (parent) {
        parent.replies = parent.replies || []
        parent.replies.push(node)
      } else {
        // Parent not found in current page, treat as root
        roots.push(node)
      }
    } else {
      roots.push(node)
    }
  }

  return roots
}
