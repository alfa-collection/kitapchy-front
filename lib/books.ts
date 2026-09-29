export type Book = {
  id?: number;
  documentId?: string;
  name: string;
  slug: string;
  desc?: string;
  difficulty?: number;
  duration?: number | string;
  segment_count?: number;
  published?: string;
  views?: number;
  image?: { url?: string; formats?: { small?: { url?: string } } } | null;
  genre_id?: Array<{ name: string }>;
  authors_or_directors_id?: Array<{ name: string }>;
};

export const sampleBooks: Book[] = [
  { name: "Pride and Prejudice", slug: "pride-and-prejudice", desc: "A witty and moving story of first impressions, family and finding love.", difficulty: 2, duration: "11:33", published: "1813", genre_id: [{ name: "Classic" }], authors_or_directors_id: [{ name: "Jane Austen" }] },
  { name: "The Great Gatsby", slug: "the-great-gatsby", desc: "A glittering portrait of longing and the American dream.", difficulty: 3, duration: "4:49", published: "1925", genre_id: [{ name: "Novel" }], authors_or_directors_id: [{ name: "F. Scott Fitzgerald" }] },
  { name: "Little Women", slug: "little-women", desc: "Four sisters grow up, dream big and make a home together.", difficulty: 2, duration: "13:02", published: "1868", genre_id: [{ name: "Classic" }], authors_or_directors_id: [{ name: "Louisa May Alcott" }] },
  { name: "Sherlock Holmes", slug: "sherlock-holmes", desc: "Cases, clues and one very observant detective.", difficulty: 3, duration: "9:16", published: "1892", genre_id: [{ name: "Mystery" }], authors_or_directors_id: [{ name: "Arthur Conan Doyle" }] },
  { name: "The Secret Garden", slug: "the-secret-garden", desc: "A forgotten garden slowly brings a lonely house back to life.", difficulty: 2, duration: "7:18", published: "1911", genre_id: [{ name: "Children's" }], authors_or_directors_id: [{ name: "Frances Hodgson Burnett" }] },
  { name: "Dracula", slug: "dracula", desc: "An unsettling journey into the shadows of Transylvania.", difficulty: 4, duration: "15:02", published: "1897", genre_id: [{ name: "Horror" }], authors_or_directors_id: [{ name: "Bram Stoker" }] },
];

export const initialText = [
  ["It is a truth universally acknowledged, that a single man in possession of a good fortune, must be in want of a wife.", "Все знают, что молодой человек, располагающий средствами, должен подыскивать себе жену."],
  ["However little known the feelings or views of such a man may be on his first entering a neighbourhood, this truth is so well fixed in the minds of the surrounding families, that he is considered the rightful property of some one or other of their daughters.", "Как бы мало ни были известны намерения и взгляды такого человека после того, как он поселился на новом месте, эта истина настолько прочно овладевает умами неподалеку живущих семейств, что на него тут же начинают смотреть как на законную добычу той или другой соседской дочки."],
  ["“My dear Mr. Bennet,” said his lady to him one day, “have you heard that Netherfield Park is let at last?”", "— Дорогой мистер Беннет, — сказала как-то раз миссис Беннет своему мужу, — слышали вы, что Незерфилд-парк наконец больше не будет пустовать?"],
  ["Mr. Bennet replied that he had not.", "Мистер Беннет ответил, что он этого не слыхал."],
];
