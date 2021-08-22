# webservice frontpage of assistant.tuana9a.com

<pre>
webservice làm frontpage, adminpage cho tất cả app, webservice hỗ trợ bản thân mình
- <a href="https://github.com/tuana9a/app1.assistant">app1.assistant</a> (front and admin page)
- <a href="https://github.com/tuana9a/app2.assistant">app2.assistant</a> (xem trước thời khoá biểu)
- <a href="https://github.com/tuana9a/app3.assistant">app3.assistant</a> (tự động đăng kí học tập)
- <a href="https://github.com/tuana9a/app4.assistant">app4.assistant</a> (captcha to text)
- ... 
các bạn có thể <a href="https://github.com/tuana9a/tuana9a">liên hệ mình</a> để lấy config hoặc cần hỗ trợ
</pre>

# #structure

<pre>
khi build src typecript toàn bộ nằm trong thư mục dist

-- ./
   |-- dist/
   |-- resource/
   |       |-- app-config.json
   |       |-- worker-config.json (chứa địa chỉ các service còn lại)
   |-- src/
   |-- webapp/ (chưa frontend cho cả project)
</pre>

# #prepare

<pre>
npm install
tsc --build
</pre>

# #run

<pre>
npm start
</pre>
