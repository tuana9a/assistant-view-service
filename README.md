# webservice frontpage of assistant.tuana9a.com

<pre>
webservice làm frontpage, adminpage cho tất cả app, webservice hỗ trợ bản thân mình
- <a href="https://github.com/tuana9a/app1.assistant">app1.assistant</a> (landing, admin)
- <a href="https://github.com/tuana9a/app2.assistant">app2.assistant</a> (xem trước thời khoá biểu)
- <a href="https://github.com/tuana9a/app3.assistant">app3.assistant</a> (tự động đăng kí học tập)
- <a href="https://github.com/tuana9a/app4.assistant">app4.assistant</a> (HUST's captcha to text)
- ... 
các bạn có thể <a href="https://github.com/tuana9a/tuana9a">liên hệ mình</a> khi cần hỗ trợ
mọi thông tin có thể public mình để ở <a href="https://drive.google.com/drive/folders/1Y9TYwdA-t1vudhznTaONIL5r_UYBvYPO?usp=sharing">thư mục drive</a>
</pre>

# #structure

<pre>
khi build src typecript toàn bộ nằm trong thư mục dist
webapp/ là frontend cho project

-- ./
   |-- dist/
   |-- resource/
   |       |-- app-config.json
   |-- src/
   |-- webapp/
           |-- app-config.json
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
