import mysql from 'mysql2/promise'

export async function initDb() {
    const initConnection =await mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "root",
        port: "3306",
    })

    const CREATE_DB_QUERY = `CREATE DATABASE IF NOT EXISTS ecommerce;`;

    const USE_DB_QUERY = "USE ecommerce;";

    const CREATE_TABLE_QUERY = `CREATE TABLE IF NOT EXISTS orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    productId VARCHAR(24) NOT NULL,
    quantity INT NOT NULL,
    customerName VARCHAR(255) NOT NULL,
    totalPrice DECIMAL(10,2) NOT NULL,
    orderDate DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    `;
    await initConnection.query(CREATE_DB_QUERY)
    await initConnection.query(USE_DB_QUERY)
    await initConnection.query(CREATE_TABLE_QUERY)

    await initConnection.end()
}