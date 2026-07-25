/**
 * Book review URLs use ids like `book_<uuid>` (see prisma-book-repository `newBookId`).
 */
export const bookReviewPathRegex = /\/parent\/books\/book_[^/]+\/review/;
