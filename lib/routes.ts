export function memberPath(uid: string): string {
  return `/member?uid=${encodeURIComponent(uid)}`;
}

export function postPath(postId: string): string {
  return `/post?id=${encodeURIComponent(postId)}`;
}
