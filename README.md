# Thanh Phung — 3D Portfolio

Portfolio 3D và desktop OS là hai ứng dụng riêng trong cùng repository:

- `portfolio-website`: giao diện 3D sử dụng Webpack và Three.js.
- `portfolio-inner-site`: ứng dụng React hiển thị trên màn hình máy tính.
- `portfolio-inner-site/src/portfolio.config.json`: thông tin cá nhân, dự án và URL dùng chung.

## Chạy local

Yêu cầu Node.js và npm. Trong PowerShell tại thư mục repository:

```powershell
npm.cmd ci
npm.cmd run install:projects
npm.cmd run dev
```

Mở http://localhost:8080. Inner site chạy ở http://localhost:3000. Nhấn Ctrl+C để dừng cả hai.

`install:projects` cài dependencies cho từng ứng dụng. Nếu PowerShell không nhận npm trên máy Windows đã cài Node tại `C:\Program Files\nodejs`, chạy `$env:Path = 'C:\Program Files\nodejs;' + $env:Path` trước.

## Triển khai Vercel

Đưa repository này lên GitHub và tạo **hai Vercel Project** từ cùng repository:

1. **Inner site:** Root Directory là `portfolio-inner-site`. `vercel.json` cấu hình `npm ci`, `npm run build`, output `build` và rewrite các route của React. Triển khai và lấy URL HTTPS của inner site.
2. **Website 3D:** Root Directory là `portfolio-website`. Bật **Include source files outside of the Root Directory** để build đọc được cấu hình chung từ sibling `portfolio-inner-site`. Đặt environment variable `INNER_SITE_URL` là URL HTTPS của inner site cho môi trường cần triển khai, sau đó deploy. `vercel.json` cấu hình `npm ci`, `npm run build`, output `public`.
3. Sau khi deploy, kiểm tra trang 3D, iframe, các route `/about`, `/experience`, `/projects`, `/contact` khi truy cập trực tiếp, hình ảnh và GIF. Website 3D sẽ dừng build nếu thiếu cấu hình dùng chung hoặc URL HTTPS của inner site.

Vercel: https://vercel.com/docs/monorepos/monorepo-faq

## Banner dự án

Trong `portfolio-inner-site/src/portfolio.config.json`, `image` là ảnh dự phòng và `media` có thể trỏ đến GIF, MP4 hoặc WebM trong `portfolio-inner-site/public/portfolio-projects/`. GIF sẽ phát lặp; video phát không tiếng và lặp. Cấu hình giảm chuyển động dùng ảnh tĩnh.

## Ghi công và quyền sử dụng

Website được tùy chỉnh từ portfolio của Henry Heffernan. Giữ thông báo bản quyền và giấy phép gốc trong `portfolio-website/LICENSE.md`, cùng phần ghi công Credits. Một số model, âm thanh và trò chơi là tài nguyên bên thứ ba; cần xác minh quyền sử dụng của chúng trước khi công khai. Bản source của inner-site không có tệp license riêng trong bản clone.

CV và ảnh cá nhân trong `portfolio-inner-site/public` là file công khai khi repository hoặc website được công bố.
