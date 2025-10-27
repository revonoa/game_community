import 'dotenv/config';
import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';

async function main(){
    const{
        DB_HOST, DB_PORT = 3306, DB_USER, DB_PASSWORD, DB_NAME,
    ADMIN_USERNAME, ADMIN_PASSWORD, ADMIN_EMAIL, ADMIN_NICKNAME
    } = process.env;

    if(!ADMIN_USERNAME || !ADMIN_PASSWORD || !ADMIN_EMAIL || !ADMIN_NICKNAME){
        console.error('[ERR] ADMIN_*환경변수를 모두 설정하세요');
        process.exit(1);
    }

    const pool = await mysql.createPool({
        host : DB_HOST,
        port: DB_PORT,
        user: DB_USER,
        password: DB_PASSWORD,
        database: DB_NAME,
        connectionLimit: 5,
    });

    try {
    // 이미 관리자 존재하면 중단
    const [rows] = await pool.query(
      'SELECT id FROM users WHERE is_admin=1 LIMIT 1'
    );
    if (rows.length) {
      console.log('[SKIP] 이미 관리자 계정이 존재합니다. 종료합니다.');
      process.exit(0);
    }

    // username/email 중복 방지 체크
    const [dup] = await pool.query(
      'SELECT id FROM users WHERE username=? OR email=? LIMIT 1',
      [ADMIN_USERNAME, ADMIN_EMAIL]
    );
    if (dup.length) {
      console.error('[ERR] 동일한 username/email 사용자가 이미 있습니다. 다른 값으로 설정하세요.');
      process.exit(1);
    }

    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    await pool.query(
      `INSERT INTO users (username, nickname, password_hash, email, is_approved, is_admin)
       VALUES (?, ?, ?, ?, 1, 1)`,
      [ADMIN_USERNAME, ADMIN_NICKNAME, hash, ADMIN_EMAIL]
    );

    console.log('[OK] 최초 관리자 계정을 생성했습니다:', ADMIN_USERNAME);
    process.exit(0);
  } catch (e) {
    console.error('[ERR] 관리자 생성 실패:', e.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();