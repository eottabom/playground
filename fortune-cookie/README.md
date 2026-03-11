# Fortune Cookie

HTML/CSS/TypeScript로 만든 포츈쿠키 미니 페이지입니다.

## Files

- `index.html` 페이지 진입점
- `styles.css` 포츈쿠키 전용 스타일
- `fortune.ts` 동작 로직 원본
- `fortune.js` 브라우저에서 실제로 로드하는 컴파일 결과물
- `i18n.json` 포츈쿠키 전용 문구, 키워드, 색상 데이터
- `favicon.svg` 탭 아이콘

## Run

```bash
cd /Users/yukeun/workspace/playground
npx serve . -l 3000
```

브라우저

- `http://localhost:3000/`
- `http://localhost:3000/fortune-cookie/`

## Build

`fortune.ts`를 수정했으면 다시 컴파일합니다.

```bash
cd /Users/yukeun/workspace/playground/fortune-cookie
npx tsc fortune.ts --target es2018 --lib dom,es2018 --module none
```
