# TripLikeJ 개발 규칙

## 코드 변경 시 반드시 병행 수정

UI/기능 변경은 Flutter와 웹 버전 **둘 다** 수정해야 한다.

| Flutter | 웹 |
|---|---|
| `lib/` (Dart) | `docs/app.jsx` (React/JSX) |

## 웹 빌드

`docs/app.jsx` 수정 후 반드시 빌드 실행:

```bash
cd /home/user/TripLikeJ/docs && bash build.sh
```

빌드하면 SW 버전 자동 증가 + `bundle.min.js` 재생성됨.
빌드 결과물(`app.js`, `bundle.js`, `bundle.min.js`, `sw.js`, `index.html`)도 함께 커밋.
