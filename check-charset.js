require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkCharset() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      port: parseInt(process.env.DB_PORT),
    });

    console.log('🔍 Checking database charset...');
    
    // Check database charset
    const [dbCharset] = await connection.execute('SELECT DEFAULT_CHARACTER_SET_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?', [process.env.DB_DATABASE]);
    console.log('Database charset:', dbCharset[0]?.DEFAULT_CHARACTER_SET_NAME);
    
    // Check table charsets
    const [tableCharsets] = await connection.execute(`
      SELECT TABLE_NAME, TABLE_COLLATION 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'
    `, [process.env.DB_DATABASE]);
    
    console.log('\n📊 Table charsets:');
    tableCharsets.forEach(table => {
      console.log(`   ${table.TABLE_NAME}: ${table.TABLE_COLLATION}`);
    });
    
    // Fix charset if needed
    console.log('\n🔧 Converting to UTF-8...');
    
    // Convert database
    await connection.query(`ALTER DATABASE \`${process.env.DB_DATABASE}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log('✅ Database converted to UTF-8');
    
    // Convert key tables
    const tables = ['currencies', 'users', 'categories', 'company_settings', 'tevkifat_rates'];
    for (const table of tables) {
      try {
        await connection.query(`ALTER TABLE \`${table}\` CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log(`✅ Table ${table} converted to UTF-8`);
      } catch (error) {
        console.log(`⚠️  Warning for ${table}: ${error.message}`);
      }
    }
    
    await connection.end();
    console.log('🎉 Charset conversion completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkCharset();