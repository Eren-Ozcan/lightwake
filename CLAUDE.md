# Lightwake

## Store / Marketing Assets

Marketing assets such as the store listing, feature graphic, icon, and
screenshots are **never committed to this public repo**. They are saved in two
places:

1. A local, gitignored copy: `docs/store-assets-originals/`.
2. A private backup repo: `C:\Projects\pictures\lightwake\` (the local
   clone of the private `Eren-Ozcan/pictures` repo) — assets are copied there
   and committed + pushed in that repo.

## Licensing

This repo is proprietary: the root `LICENSE` is an all-rights-reserved notice
(copyright Yilk Games), and GitHub therefore reports no open-source license.
Never replace it with MIT or any other permissive licence, and never leave a
scaffold's own LICENSE file (Expo's, Unity's, a starter template's) in the repo
root — that would publish this project under someone else's terms.

There are no bundled third-party fonts or asset packs at the moment. If you add
one, keep its licence text in the repo, ship that text with the build when the
licence demands it (SIL OFL fonts do), and create a `THIRD-PARTY-NOTICES.md`
listing it.

## Studio-wide information

For studio-wide questions that are not specific to this game — the Google
account, the Play Console developer account, the status of
yilkgames.com/yilkgames_web — `C:\Projects\pictures\STUDIO.md` is the single
source of truth; it is not duplicated here.
