-- Pages/Workers 的紧 CPU 配额不适合在每次登录时执行高迭代 PBKDF2。
-- 账号继续使用独立随机盐，并以 SESSION_SECRET 作为服务端 pepper 生成 HMAC-SHA256。
UPDATE accounts SET password_hash = '3ba4879b63d6d3b784b98060d543898734ffd24040e7fb9014c3ff2f8afaaea8' WHERE username = 'student01';
UPDATE accounts SET password_hash = '9a581a050c69945526d4ca57398c43d447b829f1eb906e0aeb54356e666e00f1' WHERE username = 'student02';
UPDATE accounts SET password_hash = 'f33eb11b81324d3b0ef88be70055129b7c7663fb9eb6e9ea4df98bb62be33708' WHERE username = 'student03';
UPDATE accounts SET password_hash = 'd3aae51e68b1346220ccc37957c552c0ec17fbf952415776199d29e31868d78d' WHERE username = 'teacher01';
UPDATE accounts SET password_hash = '658c3e18b24103b4c94b20a01ae23dbc5c053991ae390324c0c688d80cdad0f3' WHERE username = 'teacher02';
