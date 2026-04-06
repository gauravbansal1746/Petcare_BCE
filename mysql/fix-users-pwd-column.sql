-- Run this in MySQL Workbench or: mysql -u root -p petcare < mysql/fix-users-pwd-column.sql
-- bcrypt password hashes are 60 characters; VARCHAR(50) truncates them and breaks login.

USE petcare;

ALTER TABLE users MODIFY COLUMN pwd VARCHAR(255) NOT NULL;
