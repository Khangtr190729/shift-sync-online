# Hướng Dẫn & Quy Chuẩn Kỹ Thuật Tối Ưu Hiệu Năng (PERFORMANCE)

Tài liệu này đóng vai trò là kim chỉ nam kỹ thuật chuẩn mực cho toàn bộ hệ thống **Ca Làm Online** (bao gồm Web, Mobile và kết nối Backend), phân tích cặn kẽ bản chất vật lý và kiến trúc phần mềm đằng sau các vấn đề giật/lag (jank, drop frame) khi thêm hiệu ứng chuyển động, xử lý dữ liệu lớn hay tương tác thời gian thực. Đồng thời, tài liệu xác lập các quy chuẩn bắt buộc để đảm bảo ứng dụng luôn đạt tốc độ phản hồi 60 FPS – 120 FPS ổn định như các sản phẩm công nghệ hàng đầu thế giới (Google, Apple, Meta).

---

## 1. Triết Lý Hiệu Năng & Ngân Sách Khung Hình (Frame Budget)

### 1.1. Bản chất của Chuyển động Mượt mà
Mắt người nhận thức chuyển động liên tục thông qua một chuỗi các khung hình tĩnh xuất hiện nối tiếp nhau.
- **Tần số quét chuẩn (60 Hz):** Mỗi giây màn hình làm mới 60 lần. Thời gian tối đa để hệ thống tính toán và vẽ xong 1 khung hình là:
  $$\text{Frame Budget (60 FPS)} = \frac{1000\text{ ms}}{60} \approx 16.67\text{ ms}$$
- **Màn hình tần số quét cao (Apple ProMotion 120 Hz, Android 120 Hz):** Thời gian tối đa chỉ còn:
  $$\text{Frame Budget (120 FPS)} = \frac{1000\text{ ms}}{120} \approx 8.33\text{ ms}$$

Nếu việc thực thi JavaScript, tính toán kích thước, hoặc vẽ điểm ảnh (pixel) vượt quá ngân sách trên dù chỉ $1\text{ ms}$, khung hình đó sẽ bị bỏ qua (Drop Frame / Jank), dẫn đến cảm giác giật cục, khựng lại khi vuốt chạm.

### 1.2. Các Chỉ Số Hiệu Năng Cốt Lõi (Core Web Vitals & App Responsiveness)
Toàn bộ dự án phải được đối soát theo 3 chỉ số then chốt:
1. **INP (Interaction to Next Paint) / Touch Latency:** Độ trễ từ lúc người dùng chạm/nhấp vào nút bấm đến khi khung hình tiếp theo phản hồi. Mục tiêu: $< 100\text{ ms}$ (Tốt), $< 50\text{ ms}$ (Đẳng cấp Apple).
2. **LCP (Largest Contentful Paint):** Thời gian khối nội dung quan trọng nhất hiển thị xong. Mục tiêu: $< 1.8\text{ s}$.
3. **CLS (Cumulative Layout Shift):** Độ lệch bố cục không báo trước khi các thành phần render xong. Mục tiêu: $< 0.05$.

---

## 2. Nguyên Lý Tận Dụng GPU & Browser Rendering Pipeline

### 2.1. Chu Trình Xử Lý Đồ Họa Của Trình Duyệt (Browser Pipeline)
Khi một phần tử thay đổi trạng thái hoặc thực hiện hoạt ảnh, trình duyệt trải qua tối đa 5 công đoạn:

```
[JavaScript / DOM Update] 
        ↓
    [Style] (Tính toán CSS Rules)
        ↓
   [Layout / Reflow] (Tính toán tọa độ x, y, width, height trên CPU)
        ↓
   [Paint / Repaint] (Tô màu, vẽ viền, text, bóng đổ lên từng Bitmap trên CPU)
        ↓
 [Composite Layers] (Ghép các lớp đồ họa lại và vẽ ra màn hình bằng GPU)
```

### 2.2. Tử Huyệt Gây Lag: Layout Thrashing & Reflow
- **Sai lầm phổ biến:** Tạo hiệu ứng di chuyển, mở rộng modal, thanh trượt menu bằng cách thay đổi:
  `top`, `left`, `margin`, `padding`, `width`, `height`, `font-size`, `display`.
- **Hậu quả:** Mỗi frame chạy (16.6ms), CPU bị ép tính toán lại vị trí không gian của không chỉ phần tử đó mà của toàn bộ cây DOM lân cận (**Reflow/Layout**), sau đó tô lại điểm ảnh (**Paint**). CPU quá tải $\to$ Drop FPS nghiêm trọng.
- **Forced Synchronous Layout:** Vừa ghi thuộc tính làm bẩn bố cục (vd: `el.style.width = '100px'`), ngay sau đó đọc lại thuộc tính hình học (vd: `el.offsetWidth`). Trình duyệt bị cưỡng bức phải dừng toàn bộ tác vụ để tính Layout ngay lập tức.

### 2.3. Quy Tắc Vàng: Chỉ Thao Tác Trên `transform` & `opacity`
Google và Apple tối ưu mượt mà vì họ chỉ cấp quyền chuyển động cho 2 thuộc tính mà GPU hỗ trợ xử lý độc lập:
1. **`transform` (`translate3d`, `scale`, `rotate`, `skew`):** Không làm biến đổi cấu trúc hình học của các phần tử xung quanh.
2. **`opacity`:** Không thay đổi hình dáng, chỉ hòa trộn alpha kênh màu.

Khi sử dụng `transform` và `opacity`, trình duyệt **nhảy cóc hoàn toàn qua 2 giai đoạn Layout và Paint**, bàn giao dữ liệu thẳng cho luồng **Compositor Thread** trên GPU. Khung hình đạt chuẩn 60/120 FPS kể cả khi Main Thread đang có tác vụ tính toán nhẹ.

### 2.4. Kỹ Thuật FLIP (First, Last, Invert, Play)
Khi bắt buộc phải làm hiệu ứng biến đổi hình học (ví dụ: chuyển từ thẻ danh sách nhỏ bung rộng thành modal chi tiết ca làm full màn hình), không được tween trực tiếp `width`/`height`. Phải áp dụng thuật toán FLIP:
- **First (F):** Ghi lại tọa độ và kích thước ban đầu (`getBoundingClientRect()`).
- **Last (L):** Áp dụng ngay trạng thái cuối cùng, để trình duyệt cập nhật layout trong một tick duy nhất. Ghi lại tọa độ đích.
- **Invert (I):** Dùng `transform: translate(Δx, Δy) scale(Δw, Δh)` để "kéo ngược" phần tử đích về đúng hình dáng và vị trí ban đầu (First). Giai đoạn này mắt người chưa kịp thấy vì chưa vẽ.
- **Play (P):** Kích hoạt transition đưa `transform` về `none` (`translate(0, 0) scale(1)`). Toàn bộ chuyển động bung to diễn ra mượt mà trên GPU.

### 2.5. Compositing Layers: Con Dao Hai Lưỡi `will-change`
- **Lợi ích:** Đặt CSS `will-change: transform, opacity;` hoặc `transform: translateZ(0);` để thông báo cho trình duyệt tách phần tử ra một lớp đồ họa riêng (Compositing Layer) trên VRAM GPU trước khi hiệu ứng diễn ra.
- **Cảnh báo rủi ro (VRAM Exhaustion):** Mỗi Layer chiếm một lượng bộ nhớ GPU vật lý tỉ lệ thuận với diện tích bề mặt pixel. Lạm dụng `will-change` trên hàng chục item trong bảng lịch sẽ làm tràn bộ nhớ VRAM, gây hiện tượng nhấp nháy trắng màn hình (blank screen crash).
- **Quy tắc dự án:** Chỉ bật `will-change` khi phần tử chuẩn bị chuyển động (ví dụ qua `:hover`, `:active`) và gỡ bỏ ngay khi chuyển động kết thúc.

---

## 3. Quản Lý Đa Luồng Trên Mobile (React Native / Expo)

### 3.1. Sự Tách Biệt Của 2 Luồng: JS Thread & UI Thread
Trong ứng dụng di động React Native:
- **JavaScript Thread (JS Thread):** Chịu trách nhiệm chạy code JS của lập trình viên, gọi API, xử lý business logic, quản lý Redux/Zustand state, tính toán Virtual DOM diffing.
- **UI Thread (Main / Native Thread):** Chịu trách nhiệm tiếp nhận thao tác chạm (touch events), tính toán hiển thị của hệ điều hành iOS/Android và vẽ pixel ra màn hình.

### 3.2. Cầu Nối (Bridge) & Nghẽn Mạch Khung Hình
Ở kiến trúc cũ, dữ liệu giữa JS Thread và UI Thread được tuần tự hóa (serialize) thành chuỗi JSON và bắn qua cầu nối (Bridge).
- Nếu khi người dùng vuốt danh sách ca làm, JS Thread phải tính toán dữ liệu hoặc re-render một component nặng, thông tin phản hồi vuốt bị tắc nghẽn ở Bridge $\to$ Giao diện khựng lại dù ngón tay người dùng vẫn đang di chuyển trên mặt kính.

### 3.3. Giải Pháp Bắt Buộc Trong Dự Án
1. **`useNativeDriver: true`:** Khi sử dụng API `Animated` mặc định của React Native cho `transform` và `opacity`, bắt buộc đặt `useNativeDriver: true`. Cờ này ra lệnh cho hệ thống đẩy toàn bộ cấu hình animation sang Native UI Thread chạy độc lập, JS Thread bị chặn cũng không gây drop frame animation.
2. **Thư viện Reanimated & C++ Worklets:** Sử dụng React Native Reanimated để viết các đoạn mã hoạt ảnh chạy trực tiếp trên luồng UI bằng C++ thông qua kiến trúc JSI (JavaScript Interface), loại bỏ hoàn toàn độ trễ JSON Bridge.
3. **Khai thác React Native New Architecture (Fabric Renderer):** Cơ chế dựng hình mới với đồng bộ hai chiều trực tiếp giữa C++ Core và Native Views, giảm tối đa thời gian khởi tạo và cập nhật giao diện.

---

## 4. Kiểm Soát Virtual DOM & Chu Kỳ Re-render

### 4.1. Bản Chất của Re-render Lãng Phí (Subtree Re-rendering)
Trong React, khi một component cha re-render, theo mặc định **toàn bộ cây con cháu (children) của nó sẽ bị re-render** bất kể props truyền vào cho con có thay đổi hay không. 
- *Ví dụ thực tế trong Ca Làm Online:* Trên màn hình xếp ca tuần (`ScheduleTimetableGrid`), khi người dùng bấm mở tooltip hoặc tick chọn 1 ca, nếu đặt state ở component cha thì cả bảng với hơn 70 ô ca làm và hàng trăm tên nhân viên đều bị kích hoạt re-render!

### 4.2. Chiến Lược Cô Lập Thành Phần (Component Isolation)
- **Đẩy State xuống sâu nhất có thể (Push State Down):** Nếu một trạng thái chỉ phục vụ cho một nút bấm hoặc một modal nhỏ, hãy giam nó lại bên trong component đó, không kéo lên page hoặc layout cha.
- **Tách Component Hiển thị Danh Sách thành các Item độc lập:**
  Mọi item lặp qua hàm `.map()` (ví dụ: `ShiftSlotItem`, `MemberCardItem`, `NotificationItem`) bắt buộc phải được tách thành một file/component độc lập.

### 4.3. Ứng Dụng `React.memo` & So Sánh Nông (Shallow Equality)
- Bọc các component danh sách bằng `React.memo(Component)`. `React.memo` sẽ so sánh nông (shallow compare `prevProps === nextProps`). Nếu props không đổi, React bỏ qua hoàn toàn việc tính toán Virtual DOM cho nhánh đó.
- **Lưu ý tử huyệt:** `React.memo` sẽ vô dụng nếu component cha truyền xuống các hàm vô danh inline (ví dụ: `onClick={() => handleDelete(id)}`) hoặc object literal mới (ví dụ: `style={{ color: 'red' }}`) trong mỗi chu kỳ render. Bắt buộc phải kết hợp với `useCallback` cho handlers và `useMemo` cho object/mảng tính toán.

### 4.4. Tránh Bẫy "Context Hell" Gây Re-render Toàn Ứng Dụng
- React Context không có cơ chế Selective Subscription. Khi `value` của Context đổi, mọi component gọi `useContext(MyContext)` đều bị ép render lại, kể cả khi chúng chỉ cần một biến nhỏ không đổi trong Context đó.
- **Giải pháp:** Tách nhỏ Context theo từng phạm vi độc lập, hoặc dùng mô hình Atomic State (Zustand) với cơ chế selector:
  ```javascript
  // Chỉ re-render khi storeName thay đổi, bỏ qua mọi thay đổi khác của store
  const storeName = useAuth((state) => state.store?.name);
  ```

---

## 5. Kỹ Thuật Lập Lịch, Tiết Lưu & Concurrent Mode

### 5.1. Concurrent Mode trong React 18/19: Interruptible Rendering
Trước React 18, quá trình render của React là đồng bộ và không thể gián đoạn (Uninterruptible). Nếu React đang render bảng 500 nhân viên mà người dùng bấm nút Hủy, thao tác nhấp chuột bị treo cho đến khi render xong.
Trong dự án **Ca Làm Online**, áp dụng 2 vũ khí quan trọng:
1. **`startTransition`:**
   Gắn nhãn các tác vụ cập nhật giao diện không khẩn cấp (ví dụ: chuyển tuần lịch làm việc, lọc danh sách nhân viên theo phòng ban).
   ```javascript
   import { startTransition } from 'react';

   // Tác vụ tức thì: Đổi tab trên giao diện ngay lập tức
   setActiveTab('all');

   // Tác vụ nặng: Lọc và dựng lại danh sách lớn (có thể bị gián đoạn nếu user click tiếp)
   startTransition(() => {
     setFilteredEmployees(heavyFilterLogic(allEmployees));
   });
   ```
2. **`useDeferredValue`:**
   Trì hoãn việc cập nhật dữ liệu của danh sách tìm kiếm, giúp thanh nhập liệu (Input) phản hồi gõ bàn phím trơn tru 120 FPS không bị khựng:
   ```javascript
   const [keyword, setKeyword] = useState('');
   const deferredKeyword = useDeferredValue(keyword);
   // Giao diện ô nhập cập nhật ngay bằng 'keyword'
   // Danh sách kết quả bên dưới cập nhật theo 'deferredKeyword' khi CPU rảnh rỗi
   ```

### 5.2. Điều Phối Khung Hình với `requestAnimationFrame` (rAF)
Khi cần thực hiện logic can thiệp vào DOM theo thời gian thực (ví dụ: đo tọa độ chuột khi kéo thả ca làm `FullCalendar`), tuyệt đối không dùng `setInterval` hay `setTimeout`. Hãy gom các lệnh vào `requestAnimationFrame`. Trình duyệt sẽ xếp hàng để thực thi code ngay trước lần vẽ khung hình kế tiếp, đồng bộ hoàn hảo với chu kỳ làm tươi phần cứng.

### 5.3. Tiết Lưu (Throttling) & Trì Hoãn (Debouncing)
- **Debounce:** Dùng cho các sự kiện tìm kiếm khi gõ phím (`search input`), chỉ kích hoạt API sau khi người dùng ngừng gõ $300\text{ ms} - 500\text{ ms}$.
- **Throttle:** Dùng cho các sự kiện phát sinh liên tục như cuộn trang (`window.onscroll`), resize cửa sổ (`window.onresize`), chỉ cho phép chạy 1 lần sau mỗi khoảng thời gian nhất định (ví dụ: $50\text{ ms} - 100\text{ ms}$).

---

## 6. Tối Ưu Dữ Liệu Lớn & DOM Virtualization

### 6.1. Giới Hạn Của DOM Truyền Thống
Mỗi nút DOM trên trình duyệt là một C++ object nặng nề tiêu tốn nhiều bộ nhớ RAM và thời gian kiểm duyệt sự kiện. Nếu một trang hiển thị trên 1.500 nút DOM cùng lúc, tốc độ cuộn trang và tốc độ mở trang sẽ sụt giảm rõ rệt.

### 6.2. Ảo Hóa Danh Sách (Virtualization / Windowing)
- **Cơ chế:** Chỉ render các phần tử thực sự nằm trong khung nhìn của màn hình (Viewport) cộng thêm một khoảng đệm an toàn (overscan). Khi người dùng cuộn, các phần tử trượt ra ngoài sẽ được thu hồi hoặc gỡ bỏ khỏi DOM, các phần tử mới bước vào sẽ được chèn vào.
- **Web:** Khai thác `react-window` hoặc `@tanstack/react-virtual` cho các bảng báo cáo lương, lịch sử chấm công có hàng ngàn bản ghi.
- **Mobile:** Sử dụng `@shopify/flash-list` thay thế cho `FlatList` mặc định. `FlashList` tái sử dụng (recycle) các cell view native thay vì liên tục tạo mới và hủy view, giúp tốc độ cuộn danh sách đạt 60/120 FPS ổn định với danh sách hàng chục ngàn dòng.

### 6.3. Đột Phá Mới Với CSS: `content-visibility: auto`
Đối với các trang có cấu trúc dọc dài gồm nhiều khối nội dung (ví dụ trang chủ giới thiệu sản phẩm `HomePage.jsx`):
- Không cần thư viện JS phức tạp, áp dụng thuộc tính CSS hiện đại:
  ```css
  .content-visibility-auto {
    content-visibility: auto;
    contain-intrinsic-size: 0 450px;
  }
  ```
- **Cơ chế vận hành:** Trình duyệt sẽ bỏ qua hoàn toàn công đoạn Layout và Paint cho bất kỳ section nào nằm bên dưới nếp gấp màn hình (below-the-fold) cho đến khi người dùng cuộn gần tới nó. `contain-intrinsic-size` cung cấp chiều cao giữ chỗ giả lập để thanh cuộn (scrollbar) không bị nhảy giật. Kỹ thuật này giảm tới $70\%$ thời gian Render ban đầu của trang.

---

## 7. Tối Ưu Tài Nguyên Hình Ảnh & Bộ Nhớ (Assets & Memory)

### 7.1. Định Dạng & Kích Thước Ảnh Chuẩn
- Toàn bộ hình ảnh minh họa tĩnh phải được chuyển đổi sang định dạng thế hệ mới: **WebP** hoặc **AVIF** để giảm dung lượng file xuống $30\% - 50\%$ so với JPEG/PNG truyền thống mà vẫn giữ nguyên độ sắc nét.
- Kích thước ảnh tải về phải tương ứng với độ phân giải khung hiển thị thực tế (không tải ảnh $4000 \times 3000$ để hiển thị avatar $48 \times 48$).

### 7.2. Giải Mã Ảnh Bất Đồng Bộ (`decoding="async"`)
- Mặc định, khi gặp thẻ `<img>`, trình duyệt có thể khóa Main Thread để giải mã ảnh (Image Decoding).
- Thêm thuộc tính `loading="lazy"` và `decoding="async"` trên toàn bộ hình ảnh không nằm ở đầu trang để việc giải mã diễn ra trên luồng phụ không làm đứng giao diện:
  ```jsx
  <img src={url} alt={name} loading="lazy" decoding="async" />
  ```

### 7.3. Phòng Ngừa Rò Rỉ Bộ Nhớ (Memory Leaks)
Rò rỉ bộ nhớ khiến RAM tăng dần theo thời gian, làm CPU phải chạy bộ gom rác (Garbage Collector) liên tục, gây ra các cú khựng định kỳ:
- Luôn dọn dẹp (clean-up) các trình lắng nghe sự kiện (`window.removeEventListener`), bộ hẹn giờ (`clearTimeout`, `clearInterval`) trong hàm return của `useEffect`.
- Sử dụng `AbortController` để hủy bỏ (cancel) các HTTP request Axios đang dở dang khi người dùng đã chuyển trang trước khi server kịp phản hồi, tránh gọi `setState` trên component đã bị unmount.

---

## 8. Ranh Giới Giữa DOM Truyền Thống Và Canvas / Skia / WebGL

| Tiêu chí | DOM Truyền Thống (HTML/CSS, React Native Views) | Canvas 2D / Skia / WebGL |
| :--- | :--- | :--- |
| **Bản chất** | Hướng đối tượng cây phân cấp (Retained Mode). Từng thẻ là một đối tượng sống. | Hướng vẽ trực tiếp lên một khung điểm ảnh duy nhất (Immediate Mode). |
| **Số lượng đối tượng** | Phù hợp khi $< 1.000$ phần tử tương tác. Vượt quá sẽ gây quá tải bộ nhớ và Layout. | Có thể vẽ hàng chục ngàn đối tượng/hạt (particles) chuyển động ở mức 60/120 FPS. |
| **Khả năng tiếp cận (A11y)** | Rất cao: Trình đọc màn hình (Screen Reader), bàn phím, SEO tự động hiểu cấu trúc. | Thấp: Màn hình chỉ là một bức tranh điểm ảnh, cần tự xử lý khả năng tiếp cận. |
| **Ứng dụng trong dự án** | Dùng cho $95\%$ giao diện: Bảng biểu, form nhập liệu, danh sách, nút bấm, modal. | Dùng cho đồ họa tương tác cao: Ký tên điện tử chấm công, biểu đồ Gantt tùy biến phức tạp, hiệu ứng chúc mừng sinh nhật nhân viên (Confetti). |

**Công nghệ đồ họa bổ trợ:**
- Trên Mobile: Sử dụng `@shopify/react-native-skia` khi cần vẽ biểu đồ phân tích ca làm động hoặc xử lý hiệu ứng làm mờ nền (Blur/Glassmorphism) chuẩn xác phần cứng mà không hao tổn CPU.
- Hoạt ảnh vector tương tác: Sử dụng **Rive** hoặc **Lottie** thay vì dùng hàng chục file GIF nặng nề hoặc code JavaScript animation thủ công.

---

## 9. Chiến Lược SSR, Streaming & Phòng Ngừa Bẫy "Uncanny Valley"

### 9.1. Hiện Tượng "Uncanny Valley" Trong Hydration
- Khi sử dụng SSR (Server-Side Rendering) thông thường, server render ra mã HTML và gửi về trình duyệt. Người dùng nhìn thấy giao diện hiển thị rất nhanh (FCP/LCP tốt).
- **Vấn đề cốt lõi:** Dù nhìn thấy nút bấm, người dùng nhấp chuột vào nhưng trang web không có phản ứng gì! Lý do là file JavaScript bundle đang được tải xuống và tiến hành quá trình **Hydration** (gắn các sự kiện onClick vào DOM). 
- Trong suốt giai đoạn Hydration toàn trang, Main Thread bị khóa cứng. Nếu người dùng tương tác lúc này, họ sẽ có cảm giác ứng dụng bị đơ, vỡ mộng về tốc độ.

### 9.2. Giải Pháp Hiện Đại: Streaming SSR & Selective Hydration
1. **Streaming HTML với React Suspense:**
   Không đợi toàn bộ trang render xong mới gửi về client. Server gửi ngay khung xương bố cục chính (Shell), các khối dữ liệu nặng (như bảng lịch làm việc tuần) được bọc trong `<Suspense fallback={<Skeleton />}>` và stream về sau dưới dạng các chunk nhỏ.
2. **Selective Hydration (Thủy hóa có chọn lọc):**
   Nếu người dùng nhấp vào một component chưa được hydrate, React sẽ tự động ưu tiên dừng các khối khác lại để hydrate component mà người dùng vừa tương tác trước, loại bỏ hoàn toàn độ trễ tiếp nhận hành vi.
3. **React Server Components (RSC):**
   Chuyển các thành phần chỉ cần đọc dữ liệu tĩnh chạy $100\%$ trên Server. Không gửi code JS của component đó về Client, giúp giảm $0\text{ kB}$ dung lượng bundle chuyển xuống trình duyệt.

---

## 10. Bảng Kiểm Tra Hiệu Năng Thực Chiến (Performance Review Checklist)

Mọi Pull Request hoặc thay đổi mã nguồn trong dự án **Ca Làm Online** bắt buộc phải đối chiếu qua danh sách kiểm tra sau:

### 10.1. Dành Cho Ứng Dụng Web (`web/`)
- [ ] **Animation:** Toàn bộ hiệu ứng CSS/Framer Motion chỉ thao tác trên `transform` và `opacity`. Tuyệt đối không animate `top/left/margin/width/height`.
- [ ] **Below-the-fold:** Các khối giao diện nằm dưới trang dài đã được bọc lớp `.content-visibility-auto` chưa?
- [ ] **List Components:** Các item hiển thị danh sách (`map`) có được bọc `React.memo` và gán `key` duy nhất bất biến (không dùng mảng index làm key) không?
- [ ] **Event Handlers:** Các hàm truyền vào component con memoized đã được bọc bằng `useCallback` chưa?
- [ ] **Search/Filter:** Ô tìm kiếm hoặc bộ lọc lớn có sử dụng `useDeferredValue` hoặc debounce không?
- [ ] **Clean-up:** Toàn bộ `addEventListener`, `setInterval`, `setTimeout` trong `useEffect` đều có hàm clean-up tương ứng?
- [ ] **Bundle Size:** Kiểm tra bundle phân mảnh (code-splitting) qua `React.lazy` đối với các trang quản trị ít dùng.

### 10.2. Dành Cho Ứng Dụng Mobile (`mobile/`)
- [ ] **Driver:** Mọi hiệu ứng chạy bằng `Animated` mặc định đều có khai báo `useNativeDriver: true`.
- [ ] **Complex Motion:** Các cử chỉ vuốt kéo mượt mà sử dụng `react-native-reanimated` và `react-native-gesture-handler` chạy trên UI Thread.
- [ ] **Lists:** Các danh sách ca làm, nhân viên, thông báo đều sử dụng `React.memo` cho item component và tối ưu cấu hình `initialNumToRender`, `maxToRenderPerBatch`, `windowSize`.
- [ ] **Images:** Hình ảnh avatar, logo đều có kích thước tối ưu và xử lý cache hợp lý.
- [ ] **Overdraw:** Không lồng ghép quá nhiều lớp `View` có màu nền trong suốt đè lên nhau gây lãng phí bộ xử lý đồ họa GPU.

### 10.3. Dành Cho Backend REST API (`backend/`)
- [ ] **Payload Optimization:** Sử dụng `.select('name email role')` trong truy vấn Mongoose để chỉ trả về đúng các trường client cần hiển thị, không gửi toàn bộ document nặng.
- [ ] **Lean Queries:** Sử dụng `.lean()` cho các truy vấn chỉ đọc (read-only) để Mongoose bỏ qua việc khởi tạo instance document nặng nề, tăng tốc độ truy vấn gấp 3-5 lần.
- [ ] **Pagination:** Mọi API trả về danh sách (ca làm, thành viên, log chấm công) bắt buộc phải có phân trang hoặc giới hạn thời gian (`limit`, `startDate`, `endDate`), tuyệt đối không `find({})` không giới hạn.

