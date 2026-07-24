
import sqlite3

def full_diagnostic(db_path='data/seabird_hr.db'):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print("=" * 70)
    print("FULL RECONCILIATION DIAGNOSTIC")
    print("=" * 70)

    # 1. Check Employee table
    cursor.execute('SELECT COUNT(*) FROM employees')
    emp_count = cursor.fetchone()[0]
    print(f"\n1. Total Employees: {emp_count}")

    cursor.execute('SELECT emp_code, pr_number, name FROM employees LIMIT 5')
    print("   Sample employees:")
    for row in cursor.fetchall():
        print(f"      emp_code={row[0]}, pr={row[1]}, name={row[2]}")

    # 2. Check ESSL table
    cursor.execute('SELECT COUNT(*) FROM essl_attendance')
    essl_count = cursor.fetchone()[0]
    print(f"\n2. Total ESSL Records: {essl_count}")

    cursor.execute('SELECT DISTINCT date FROM essl_attendance ORDER BY date LIMIT 5')
    print("   ESSL dates (first 5):")
    for row in cursor.fetchall():
        print(f"      {row[0]}")

    cursor.execute('SELECT emp_code, date, in_time, out_time FROM essl_attendance WHERE date = "2026-06-22" LIMIT 5')
    print("   ESSL records for 2026-06-22 (first 5):")
    for row in cursor.fetchall():
        print(f"      emp_code={row[0]}, date={row[1]}, in={row[2]}, out={row[3]}")

    # 3. Check Tata table
    cursor.execute('SELECT COUNT(*) FROM tata_attendance')
    tata_count = cursor.fetchone()[0]
    print(f"\n3. Total Tata Records: {tata_count}")

    cursor.execute('SELECT DISTINCT date FROM tata_attendance ORDER BY date LIMIT 5')
    print("   Tata dates (first 5):")
    for row in cursor.fetchall():
        print(f"      {row[0]}")

    cursor.execute('SELECT pr_number, date, in_time, out_time FROM tata_attendance WHERE date = "2026-06-22" LIMIT 5')
    print("   Tata records for 2026-06-22 (first 5):")
    for row in cursor.fetchall():
        print(f"      pr={row[0]}, date={row[1]}, in={row[2]}, out={row[3]}")

    # 4. Check if ESSL emp_codes match Employee emp_codes
    cursor.execute("SELECT COUNT(DISTINCT e.emp_code) FROM essl_attendance e JOIN employees emp ON e.emp_code = emp.emp_code")
    matching_essl = cursor.fetchone()[0]
    print(f"\n4. ESSL emp_codes matching Employee emp_codes: {matching_essl}")

    # 5. Check if Tata pr_numbers match Employee pr_numbers
    cursor.execute("SELECT COUNT(DISTINCT t.pr_number) FROM tata_attendance t JOIN employees emp ON t.pr_number = emp.pr_number")
    matching_tata = cursor.fetchone()[0]
    print(f"5. Tata pr_numbers matching Employee pr_numbers: {matching_tata}")

    # 6. Check reconciliation records
    cursor.execute('SELECT COUNT(*) FROM attendance_reconciliation WHERE date = "2026-06-22"')
    rec_count = cursor.fetchone()[0]
    print(f"\n6. Reconciliation records for 2026-06-22: {rec_count}")

    cursor.execute('SELECT match_status, COUNT(*) FROM attendance_reconciliation WHERE date = "2026-06-22" GROUP BY match_status')
    print("   Breakdown:")
    for row in cursor.fetchall():
        print(f"      {row[0]}: {row[1]}")

    # 7. Check for specific employee
    cursor.execute('SELECT emp_code, pr_number FROM employees LIMIT 1')
    sample_emp = cursor.fetchone()
    if sample_emp:
        print(f"\n7. Sample employee: emp_code={sample_emp[0]}, pr={sample_emp[1]}")
        cursor.execute('SELECT COUNT(*) FROM essl_attendance WHERE emp_code = ? AND date = "2026-06-22"', (sample_emp[0],))
        essl_for_emp = cursor.fetchone()[0]
        cursor.execute('SELECT COUNT(*) FROM tata_attendance WHERE pr_number = ? AND date = "2026-06-22"', (sample_emp[1],))
        tata_for_emp = cursor.fetchone()[0]
        print(f"   ESSL records for this emp on 2026-06-22: {essl_for_emp}")
        print(f"   Tata records for this emp on 2026-06-22: {tata_for_emp}")

    conn.close()
    print("\n" + "=" * 70)
    print("DIAGNOSTIC COMPLETE")
    print("=" * 70)

if __name__ == "__main__":
    full_diagnostic()