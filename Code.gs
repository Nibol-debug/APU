// ============================================================
// SIMDP - Sistem Informasi Manajemen Data Pegawai
// LAZWaf Al Azhar (Google Apps Script)
// ============================================================

const SPREADSHEET_ID = '1tlv5QzBo6L5rHa-tUuykp4ljADSLaSJq8qvukJ4TgYY';
const APP_NAME = 'SIMDP LAZWaf Al Azhar';
const APP_VERSION = '1.0.0';

// ============================================================
// WEB APP ENTRY POINTS
// ============================================================

function doGet(e) {
  const page = e.parameter.page || 'login';
  const template = HtmlService.createTemplateFromFile('Index');
  template.page = page;
  return template.evaluate()
    .setTitle(APP_NAME)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addSafeModeToken(true);
}

function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;
  
  switch(action) {
    case 'login': return handleLogin(data);
    case 'getDashboard': return getDashboardData();
    case 'getEmployees': return getEmployees(data);
    case 'getEmployee': return getEmployee(data.id);
    case 'addEmployee': return addEmployee(data);
    case 'updateEmployee': return updateEmployee(data);
    case 'deleteEmployee': return deleteEmployee(data.id);
    case 'getCareerHistory': return getCareerHistory(data.employeeId);
    case 'addCareerHistory': return addCareerHistory(data);
    case 'updateCareerHistory': return updateCareerHistory(data);
    case 'deleteCareerHistory': return deleteCareerHistory(data.id);
    case 'getUsers': return getUsers();
    case 'addUser': return addUser(data);
    case 'updateUser': return updateUser(data);
    case 'deleteUser': return deleteUser(data.id);
    case 'getRoles': return getRoles();
    case 'importData': return importFromSource();
    case 'exportData': return exportData(data);
    case 'getAuditLog': return getAuditLog(data);
    case 'getMasterData': return getMasterData();
    case 'updateMasterData': return updateMasterData(data);
    case 'getDashboardConfig': return getDashboardConfig();
    case 'updateDashboardConfig': return updateDashboardConfig(data);
    case 'getNotifications': return getNotifications();
    case 'getFamilyMembers': return getFamilyMembers(data.employeeId);
    case 'addFamilyMember': return addFamilyMember(data);
    case 'updateFamilyMember': return updateFamilyMember(data);
    case 'deleteFamilyMember': return deleteFamilyMember(data.id);
    case 'getDocuments': return getDocuments(data.employeeId);
    case 'uploadDocument': return uploadDocument(data);
    default:
      return ContentService.createTextOutput(JSON.stringify({success: false, message: 'Invalid action'}))
        .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

function getSheet(name) {
  return getSpreadsheet().getSheetByName(name);
}

function generateId() {
  return Utilities.getUuid();
}

function getCurrentUser() {
  const email = Session.getActiveUser().getEmail();
  return email;
}

function getUserRole(email) {
  const sheet = getSheet('users');
  if (!sheet) return null;
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === email && data[i][4] === 'aktif') {
      return {
        email: data[i][1],
        name: data[i][2],
        role: data[i][3],
        department: data[i][5] || '',
        isActive: data[i][4] === 'aktif'
      };
    }
  }
  return null;
}

function logAudit(action, module, employeeId, field, oldValue, newValue) {
  const sheet = getSheet('audit_log');
  if (!sheet) return;
  
  sheet.appendRow([
    generateId(),
    new Date().toISOString(),
    getCurrentUser(),
    action,
    module,
    employeeId || '',
    field || '',
    oldValue || '',
    newValue || '',
    ''
  ]);
}

function calculateWorkDuration(joinDate) {
  if (!joinDate) return '';
  const today = new Date();
  const join = new Date(joinDate);
  
  let years = today.getFullYear() - join.getFullYear();
  let months = today.getMonth() - join.getMonth();
  let days = today.getDate() - join.getDate();
  
  if (days < 0) {
    months--;
    days += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  
  return `${years} tahun ${months} bulan ${days} hari`;
}

function formatDate(date) {
  if (!date) return '';
  const d = new Date(date);
  return d.toISOString().split('T')[0];
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  
  // Try different formats
  const formats = [
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // MM/DD/YYYY
    /(\d{1,2})-(\d{1,2})-(\d{4})/, // DD-MM-YYYY
    /(\d{4})-(\d{1,2})-(\d{1,2})/, // YYYY-MM-DD
  ];
  
  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      return new Date(match[3], match[1] - 1, match[2]);
    }
  }
  
  return new Date(dateStr);
}

function buildResponse(success, data, message) {
  return ContentService.createTextOutput(JSON.stringify({
    success: success,
    data: data,
    message: message || ''
  })).setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// AUTHENTICATION
// ============================================================

function handleLogin(data) {
  const email = data.email || getCurrentUser();
  
  if (!email) {
    return buildResponse(false, null, 'Email tidak ditemukan');
  }
  
  const user = getUserRole(email);
  
  if (!user) {
    logAudit('LOGIN_FAILED', 'Auth', null, 'email', email, 'User not found');
    return buildResponse(false, null, 'Akun tidak terdaftar. Silakan hubungi Admin HR.');
  }
  
  // Update last login
  const sheet = getSheet('users');
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  
  for (let i = 1; i < values.length; i++) {
    if (values[i][1] === email) {
      sheet.getRange(i + 1, 7).setValue(new Date().toISOString()); // last_login
      break;
    }
  }
  
  logAudit('LOGIN_SUCCESS', 'Auth', null, 'email', email, 'Success');
  
  return buildResponse(true, {
    user: user,
    session: {
      email: email,
      role: user.role,
      loginTime: new Date().toISOString()
    }
  });
}

function checkPermission(requiredRole) {
  const email = getCurrentUser();
  const user = getUserRole(email);
  
  if (!user) return false;
  
  const roleHierarchy = {
    'super_admin': 4,
    'admin_hr': 3,
    'manager_divisi': 2,
    'staf_viewer': 1
  };
  
  return roleHierarchy[user.role] >= roleHierarchy[requiredRole];
}

// ============================================================
// DASHBOARD
// ============================================================

function getDashboardData() {
  try {
    const sheet = getSheet('pegawai');
    if (!sheet) {
      return buildResponse(false, null, 'Sheet pegawai tidak ditemukan');
    }
    
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const employees = [];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][5] && data[i][5].toString().trim() !== '') { // employee_id exists
        employees.push({
          id: data[i][0],
          employeeId: data[i][1],
          fullName: data[i][2],
          currentPosition: data[i][3],
          department: data[i][4],
          unit: data[i][5],
          employmentStatus: data[i][6],
          level: data[i][7],
          jobLevel: data[i][8],
          joinDate: data[i][9],
          email: data[i][10],
          phone: data[i][12],
          placeOfBirth: data[i][13],
          dateOfBirth: data[i][14],
          gender: data[i][15],
          maritalStatus: data[i][16],
          nik: data[i][17],
          isActive: data[i][24] !== false && data[i][24] !== 'nonaktif',
          employmentCountYear: data[i][21] || 0,
          employmentCountMonth: data[i][22] || 0
        });
      }
    }
    
    // Filter active employees
    const activeEmployees = employees.filter(e => e.isActive);
    
    // Calculate statistics
    const stats = {
      totalAktif: activeEmployees.length,
      totalTetap: activeEmployees.filter(e => e.employmentStatus === 'Tetap').length,
      totalKontrak: activeEmployees.filter(e => e.employmentStatus === 'Kontrak').length,
      totalRelawan: activeEmployees.filter(e => e.employmentStatus === 'Relawan').length,
      jkPria: activeEmployees.filter(e => e.gender === 'L').length,
      jkWanita: activeEmployees.filter(e => e.gender === 'P').length,
      perDivisi: {},
      perUnit: {},
      perLevel: {},
      masaKerjaAvg: 0,
      kontrakHabis30Hari: 0,
      joinBulanIni: 0,
      ultahMingguIni: 0
    };
    
    // Group by department
    activeEmployees.forEach(e => {
      if (e.department) {
        stats.perDivisi[e.department] = (stats.perDivisi[e.department] || 0) + 1;
      }
      if (e.unit) {
        stats.perUnit[e.unit] = (stats.perUnit[e.unit] || 0) + 1;
      }
      if (e.level) {
        stats.perLevel[e.level] = (stats.perLevel[e.level] || 0) + 1;
      }
    });
    
    // Calculate average work duration
    const totalYears = activeEmployees.reduce((sum, e) => sum + (e.employmentCountYear || 0), 0);
    stats.masaKerjaAvg = activeEmployees.length > 0 ? (totalYears / activeEmployees.length).toFixed(1) : 0;
    
    // Count contracts expiring within 30 days
    const today = new Date();
    const thirtyDaysLater = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    activeEmployees.forEach(e => {
      if (e.employmentStatus === 'Kontrak' && e.endDate) {
        const endDate = new Date(e.endDate);
        if (endDate <= thirtyDaysLater && endDate >= today) {
          stats.kontrakHabis30Hari++;
        }
      }
    });
    
    // Count employees joining this month
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    activeEmployees.forEach(e => {
      if (e.joinDate) {
        const joinDate = new Date(e.joinDate);
        if (joinDate.getMonth() === currentMonth && joinDate.getFullYear() === currentYear) {
          stats.joinBulanIni++;
        }
      }
    });
    
    // Count birthdays this week
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    activeEmployees.forEach(e => {
      if (e.dateOfBirth) {
        const dob = new Date(e.dateOfBirth);
        const thisYearBirthday = new Date(currentYear, dob.getMonth(), dob.getDate());
        if (thisYearBirthday >= startOfWeek && thisYearBirthday <= endOfWeek) {
          stats.ultahMingguIni++;
        }
      }
    });
    
    return buildResponse(true, {
      stats: stats,
      lastUpdated: new Date().toISOString(),
      employeeCount: activeEmployees.length
    });
    
  } catch (error) {
    return buildResponse(false, null, error.message);
  }
}

// ============================================================
// EMPLOYEE CRUD
// ============================================================

function getEmployees(data) {
  try {
    const sheet = getSheet('pegawai');
    if (!sheet) {
      return buildResponse(false, null, 'Sheet pegawai tidak ditemukan');
    }
    
    const sheetData = sheet.getDataRange().getValues();
    const employees = [];
    
    // Get current user's department filter
    const currentUser = getUserRole(getCurrentUser());
    const isManager = currentUser && currentUser.role === 'manager_divisi';
    const userDepartment = currentUser ? currentUser.department : '';
    
    for (let i = 1; i < sheetData.length; i++) {
      const row = sheetData[i];
      if (row[1] && row[1].toString().trim() !== '') {
        const emp = {
          id: row[0],
          employeeId: row[1],
          fullName: row[2],
          currentPosition: row[3],
          department: row[4],
          unit: row[5],
          employmentStatus: row[6],
          level: row[7],
          jobLevel: row[8],
          joinDate: row[9],
          email: row[10],
          emailPribadi: row[11],
          phone: row[12],
          placeOfBirth: row[13],
          dateOfBirth: row[14],
          gender: row[15],
          maritalStatus: row[16],
          nik: row[17],
          nikAddress: row[18],
          residentialAddress: row[19],
          educationLevel: row[20],
          institutionName: row[21],
          institutionPlace: row[22],
          graduationDate: row[23],
          isActive: row[24] !== false && row[24] !== 'nonaktif',
          inactiveDate: row[25],
          inactiveReason: row[26],
          createdAt: row[27],
          updatedAt: row[28],
          updatedBy: row[29],
          workDuration: calculateWorkDuration(row[9])
        };
        
        // Manager can only see their department
        if (isManager && emp.department !== userDepartment) {
          continue;
        }
        
        employees.push(emp);
      }
    }
    
    // Apply filters
    let filtered = employees;
    
    if (data) {
      if (data.department && data.department !== 'all') {
        filtered = filtered.filter(e => e.department === data.department);
      }
      if (data.unit && data.unit !== 'all') {
        filtered = filtered.filter(e => e.unit === data.unit);
      }
      if (data.status && data.status !== 'all') {
        filtered = filtered.filter(e => e.employmentStatus === data.status);
      }
      if (data.gender && data.gender !== 'all') {
        filtered = filtered.filter(e => e.gender === data.gender);
      }
      if (data.isActive !== undefined && data.isActive !== 'all') {
        filtered = filtered.filter(e => e.isActive === (data.isActive === 'true'));
      }
      if (data.search) {
        const search = data.search.toLowerCase();
        filtered = filtered.filter(e => 
          (e.fullName && e.fullName.toLowerCase().includes(search)) ||
          (e.employeeId && e.employeeId.toLowerCase().includes(search)) ||
          (e.nik && e.nik.includes(search)) ||
          (e.currentPosition && e.currentPosition.toLowerCase().includes(search))
        );
      }
    }
    
    return buildResponse(true, {
      employees: filtered,
      total: filtered.length
    });
    
  } catch (error) {
    return buildResponse(false, null, error.message);
  }
}

function getEmployee(id) {
  try {
    const sheet = getSheet('pegawai');
    if (!sheet) {
      return buildResponse(false, null, 'Sheet pegawai tidak ditemukan');
    }
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === id || data[i][1] === id) {
        const emp = {
          id: data[i][0],
          employeeId: data[i][1],
          fullName: data[i][2],
          currentPosition: data[i][3],
          department: data[i][4],
          unit: data[i][5],
          employmentStatus: data[i][6],
          level: data[i][7],
          jobLevel: data[i][8],
          joinDate: data[i][9],
          email: data[i][10],
          emailPribadi: data[i][11],
          phone: data[i][12],
          placeOfBirth: data[i][13],
          dateOfBirth: data[i][14],
          gender: data[i][15],
          maritalStatus: data[i][16],
          nik: data[i][17],
          nikAddress: data[i][18],
          residentialAddress: data[i][19],
          educationLevel: data[i][20],
          institutionName: data[i][21],
          institutionPlace: data[i][22],
          graduationDate: data[i][23],
          isActive: data[i][24] !== false && data[i][24] !== 'nonaktif',
          inactiveDate: data[i][25],
          inactiveReason: data[i][26],
          createdAt: data[i][27],
          updatedAt: data[i][28],
          updatedBy: data[i][29],
          workDuration: calculateWorkDuration(data[i][9])
        };
        
        // Get career history
        const careerHistory = getCareerHistoryData(emp.employeeId);
        
        // Get family members
        const familyMembers = getFamilyMembersData(emp.employeeId);
        
        return buildResponse(true, {
          employee: emp,
          careerHistory: careerHistory,
          familyMembers: familyMembers
        });
      }
    }
    
    return buildResponse(false, null, 'Karyawan tidak ditemukan');
    
  } catch (error) {
    return buildResponse(false, null, error.message);
  }
}

function addEmployee(data) {
  try {
    const sheet = getSheet('pegawai');
    if (!sheet) {
      return buildResponse(false, null, 'Sheet pegawai tidak ditemukan');
    }
    
    // Check permission
    if (!checkPermission('admin_hr')) {
      return buildResponse(false, null, 'Tidak memiliki akses untuk menambah karyawan');
    }
    
    const id = generateId();
    const now = new Date().toISOString();
    
    const newRow = [
      id,
      data.employeeId,
      data.fullName,
      data.currentPosition,
      data.department,
      data.unit,
      data.employmentStatus,
      data.level,
      data.jobLevel,
      data.joinDate,
      data.email,
      data.emailPribadi || '',
      data.phone,
      data.placeOfBirth,
      data.dateOfBirth,
      data.gender,
      data.maritalStatus,
      data.nik,
      data.nikAddress || '',
      data.residentialAddress || '',
      data.educationLevel || '',
      data.institutionName || '',
      data.institutionPlace || '',
      data.graduationDate || '',
      true,
      '',
      '',
      now,
      now,
      getCurrentUser()
    ];
    
    sheet.appendRow(newRow);
    
    logAudit('ADD', 'Data Pegawai', data.employeeId, 'new employee', '', data.fullName);
    
    return buildResponse(true, { id: id }, 'Karyawan berhasil ditambahkan');
    
  } catch (error) {
    return buildResponse(false, null, error.message);
  }
}

function updateEmployee(data) {
  try {
    const sheet = getSheet('pegawai');
    if (!sheet) {
      return buildResponse(false, null, 'Sheet pegawai tidak ditemukan');
    }
    
    // Check permission
    if (!checkPermission('admin_hr')) {
      return buildResponse(false, null, 'Tidak memiliki akses untuk mengubah data karyawan');
    }
    
    const sheetData = sheet.getDataRange().getValues();
    
    for (let i = 1; i < sheetData.length; i++) {
      if (sheetData[i][0] === data.id) {
        const now = new Date().toISOString();
        
        // Log changes
        const fields = ['fullName', 'currentPosition', 'department', 'unit', 'employmentStatus', 'level', 'jobLevel', 'joinDate', 'email', 'phone', 'gender', 'maritalStatus', 'nik'];
        const fieldIndexes = [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 16, 17];
        
        fields.forEach((field, idx) => {
          if (data[field] !== undefined && sheetData[i][fieldIndexes[idx]] !== data[field]) {
            logAudit('EDIT', 'Data Pegawai', data.employeeId || sheetData[i][1], field, sheetData[i][fieldIndexes[idx]], data[field]);
          }
        });
        
        // Update row
        const row = i + 1;
        if (data.fullName) sheet.getRange(row, 3).setValue(data.fullName);
        if (data.currentPosition) sheet.getRange(row, 4).setValue(data.currentPosition);
        if (data.department) sheet.getRange(row, 5).setValue(data.department);
        if (data.unit) sheet.getRange(row, 6).setValue(data.unit);
        if (data.employmentStatus) sheet.getRange(row, 7).setValue(data.employmentStatus);
        if (data.level) sheet.getRange(row, 8).setValue(data.level);
        if (data.jobLevel) sheet.getRange(row, 9).setValue(data.jobLevel);
        if (data.joinDate) sheet.getRange(row, 10).setValue(data.joinDate);
        if (data.email !== undefined) sheet.getRange(row, 11).setValue(data.email);
        if (data.emailPribadi !== undefined) sheet.getRange(row, 12).setValue(data.emailPribadi);
        if (data.phone) sheet.getRange(row, 13).setValue(data.phone);
        if (data.placeOfBirth) sheet.getRange(row, 14).setValue(data.placeOfBirth);
        if (data.dateOfBirth) sheet.getRange(row, 15).setValue(data.dateOfBirth);
        if (data.gender) sheet.getRange(row, 16).setValue(data.gender);
        if (data.maritalStatus) sheet.getRange(row, 17).setValue(data.maritalStatus);
        if (data.nik) sheet.getRange(row, 18).setValue(data.nik);
        if (data.nikAddress !== undefined) sheet.getRange(row, 19).setValue(data.nikAddress);
        if (data.residentialAddress !== undefined) sheet.getRange(row, 20).setValue(data.residentialAddress);
        if (data.educationLevel !== undefined) sheet.getRange(row, 21).setValue(data.educationLevel);
        if (data.institutionName !== undefined) sheet.getRange(row, 22).setValue(data.institutionName);
        if (data.institutionPlace !== undefined) sheet.getRange(row, 23).setValue(data.institutionPlace);
        if (data.graduationDate !== undefined) sheet.getRange(row, 24).setValue(data.graduationDate);
        if (data.isActive !== undefined) sheet.getRange(row, 25).setValue(data.isActive);
        
        sheet.getRange(row, 29).setValue(now);
        sheet.getRange(row, 30).setValue(getCurrentUser());
        
        return buildResponse(true, null, 'Data karyawan berhasil diperbarui');
      }
    }
    
    return buildResponse(false, null, 'Karyawan tidak ditemukan');
    
  } catch (error) {
    return buildResponse(false, null, error.message);
  }
}

function deleteEmployee(id) {
  try {
    const sheet = getSheet('pegawai');
    if (!sheet) {
      return buildResponse(false, null, 'Sheet pegawai tidak ditemukan');
    }
    
    // Check permission - only super admin can delete
    if (!checkPermission('super_admin')) {
      return buildResponse(false, null, 'Tidak memiliki akses untuk menghapus karyawan');
    }
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === id) {
        const employeeId = data[i][1];
        const fullName = data[i][2];
        
        // Soft delete - mark as inactive
        sheet.getRange(i + 1, 25).setValue('nonaktif');
        sheet.getRange(i + 1, 26).setValue(new Date().toISOString());
        sheet.getRange(i + 1, 27).setValue('Dihapus oleh ' + getCurrentUser());
        
        logAudit('DELETE', 'Data Pegawai', employeeId, 'status', 'aktif', 'nonaktif');
        
        return buildResponse(true, null, 'Karyawan berhasil dinonaktifkan');
      }
    }
    
    return buildResponse(false, null, 'Karyawan tidak ditemukan');
    
  } catch (error) {
    return buildResponse(false, null, error.message);
  }
}

// ============================================================
// CAREER HISTORY
// ============================================================

function getCareerHistoryData(employeeId) {
  const sheet = getSheet('career_history');
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  const history = [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === employeeId) {
      history.push({
        id: data[i][0],
        employeeId: data[i][1],
        urutan: data[i][2],
        jabatan: data[i][3],
        department: data[i][4],
        unit: data[i][5],
        tanggalMulai: data[i][6],
        tanggalSelesai: data[i][7],
        keterangan: data[i][8],
        isCurrent: data[i][9],
        createdAt: data[i][10],
        updatedBy: data[i][11]
      });
    }
  }
  
  return history.sort((a, b) => a.urutan - b.urutan);
}

function getCareerHistory(data) {
  try {
    const history = getCareerHistoryData(data.employeeId);
    return buildResponse(true, { history: history });
  } catch (error) {
    return buildResponse(false, null, error.message);
  }
}

function addCareerHistory(data) {
  try {
    const sheet = getSheet('career_history');
    if (!sheet) {
      return buildResponse(false, null, 'Sheet career_history tidak ditemukan');
    }
    
    if (!checkPermission('admin_hr')) {
      return buildResponse(false, null, 'Tidak memiliki akses');
    }
    
    const id = generateId();
    const now = new Date().toISOString();
    
    // Get next urutan
    const existingHistory = getCareerHistoryData(data.employeeId);
    const nextUrutan = existingHistory.length > 0 ? Math.max(...existingHistory.map(h => h.urutan)) + 1 : 1;
    
    sheet.appendRow([
      id,
      data.employeeId,
      nextUrutan,
      data.jabatan,
      data.department || '',
      data.unit || '',
      data.tanggalMulai,
      data.tanggalSelesai || '',
      data.keterangan || '',
      data.isCurrent || false,
      now,
      getCurrentUser()
    ]);
    
    logAudit('ADD', 'Riwayat Karir', data.employeeId, 'jabatan', '', data.jabatan);
    
    return buildResponse(true, { id: id }, 'Riwayat karir berhasil ditambahkan');
    
  } catch (error) {
    return buildResponse(false, null, error.message);
  }
}

function updateCareerHistory(data) {
  try {
    const sheet = getSheet('career_history');
    if (!sheet) {
      return buildResponse(false, null, 'Sheet career_history tidak ditemukan');
    }
    
    if (!checkPermission('admin_hr')) {
      return buildResponse(false, null, 'Tidak memiliki akses');
    }
    
    const sheetData = sheet.getDataRange().getValues();
    
    for (let i = 1; i < sheetData.length; i++) {
      if (sheetData[i][0] === data.id) {
        const row = i + 1;
        
        if (data.jabatan) sheet.getRange(row, 4).setValue(data.jabatan);
        if (data.department !== undefined) sheet.getRange(row, 5).setValue(data.department);
        if (data.unit !== undefined) sheet.getRange(row, 6).setValue(data.unit);
        if (data.tanggalMulai) sheet.getRange(row, 7).setValue(data.tanggalMulai);
        if (data.tanggalSelesai !== undefined) sheet.getRange(row, 8).setValue(data.tanggalSelesai);
        if (data.keterangan !== undefined) sheet.getRange(row, 9).setValue(data.keterangan);
        if (data.isCurrent !== undefined) sheet.getRange(row, 10).setValue(data.isCurrent);
        
        sheet.getRange(row, 12).setValue(getCurrentUser());
        
        logAudit('EDIT', 'Riwayat Karir', sheetData[i][1], 'jabatan', sheetData[i][3], data.jabatan);
        
        return buildResponse(true, null, 'Riwayat karir berhasil diperbarui');
      }
    }
    
    return buildResponse(false, null, 'Riwayat karir tidak ditemukan');
    
  } catch (error) {
    return buildResponse(false, null, error.message);
  }
}

function deleteCareerHistory(id) {
  try {
    const sheet = getSheet('career_history');
    if (!sheet) {
      return buildResponse(false, null, 'Sheet career_history tidak ditemukan');
    }
    
    if (!checkPermission('admin_hr')) {
      return buildResponse(false, null, 'Tidak memiliki akses');
    }
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === id) {
        const jabatan = data[i][3];
        const employeeId = data[i][1];
        
        sheet.deleteRow(i + 1);
        
        logAudit('DELETE', 'Riwayat Karir', employeeId, 'jabatan', jabatan, '');
        
        return buildResponse(true, null, 'Riwayat karir berhasil dihapus');
      }
    }
    
    return buildResponse(false, null, 'Riwayat karir tidak ditemukan');
    
  } catch (error) {
    return buildResponse(false, null, error.message);
  }
}

// ============================================================
// FAMILY MEMBERS
// ============================================================

function getFamilyMembersData(employeeId) {
  const sheet = getSheet('family_members');
  if (!sheet) return [];
  
  const data = sheet.getDataRange().getValues();
  const members = [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === employeeId) {
      members.push({
        id: data[i][0],
        employeeId: data[i][1],
        tipe: data[i][2],
        nama: data[i][3],
        tanggalLahir: data[i][4],
        urutanAnak: data[i][5]
      });
    }
  }
  
  return members;
}

function getFamilyMembers(data) {
  try {
    const members = getFamilyMembersData(data.employeeId);
    return buildResponse(true, { members: members });
  } catch (error) {
    return buildResponse(false, null, error.message);
  }
}

function addFamilyMember(data) {
  try {
    const sheet = getSheet('family_members');
    if (!sheet) {
      return buildResponse(false, null, 'Sheet family_members tidak ditemukan');
    }
    
    const id = generateId();
    
    sheet.appendRow([
      id,
      data.employeeId,
      data.tipe,
      data.nama,
      data.tanggalLahir || '',
      data.urutanAnak || 0
    ]);
    
    return buildResponse(true, { id: id }, 'Data keluarga berhasil ditambahkan');
    
  } catch (error) {
    return buildResponse(false, null, error.message);
  }
}

function updateFamilyMember(data) {
  try {
    const sheet = getSheet('family_members');
    if (!sheet) {
      return buildResponse(false, null, 'Sheet family_members tidak ditemukan');
    }
    
    const sheetData = sheet.getDataRange().getValues();
    
    for (let i = 1; i < sheetData.length; i++) {
      if (sheetData[i][0] === data.id) {
        const row = i + 1;
        
        if (data.nama) sheet.getRange(row, 4).setValue(data.nama);
        if (data.tanggalLahir !== undefined) sheet.getRange(row, 5).setValue(data.tanggalLahir);
        
        return buildResponse(true, null, 'Data keluarga berhasil diperbarui');
      }
    }
    
    return buildResponse(false, null, 'Data keluarga tidak ditemukan');
    
  } catch (error) {
    return buildResponse(false, null, error.message);
  }
}

function deleteFamilyMember(id) {
  try {
    const sheet = getSheet('family_members');
    if (!sheet) {
      return buildResponse(false, null, 'Sheet family_members tidak ditemukan');
    }
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === id) {
        sheet.deleteRow(i + 1);
        return buildResponse(true, null, 'Data keluarga berhasil dihapus');
      }
    }
    
    return buildResponse(false, null, 'Data keluarga tidak ditemukan');
    
  } catch (error) {
    return buildResponse(false, null, error.message);
  }
}

// ============================================================
// USERS MANAGEMENT
// ============================================================

function getUsers() {
  try {
    const sheet = getSheet('users');
    if (!sheet) {
      return buildResponse(false, null, 'Sheet users tidak ditemukan');
    }
    
    if (!checkPermission('super_admin')) {
      return buildResponse(false, null, 'Tidak memiliki akses');
    }
    
    const data = sheet.getDataRange().getValues();
    const users = [];
    
    for (let i = 1; i < data.length; i++) {
      users.push({
        id: data[i][0],
        email: data[i][1],
        name: data[i][2],
        role: data[i][3],
        status: data[i][4],
        department: data[i][5],
        lastLogin: data[i][6]
      });
    }
    
    return buildResponse(true, { users: users });
    
  } catch (error) {
    return buildResponse(false, null, error.message);
  }
}

function addUser(data) {
  try {
    const sheet = getSheet('users');
    if (!sheet) {
      return buildResponse(false, null, 'Sheet users tidak ditemukan');
    }
    
    if (!checkPermission('super_admin')) {
      return buildResponse(false, null, 'Tidak memiliki akses');
    }
    
    const id = generateId();
    
    sheet.appendRow([
      id,
      data.email,
      data.name,
      data.role,
      'aktif',
      data.department || '',
      ''
    ]);
    
    logAudit('ADD', 'User Management', data.email, 'role', '', data.role);
    
    return buildResponse(true, { id: id }, 'User berhasil ditambahkan');
    
  } catch (error) {
    return buildResponse(false, null, error.message);
  }
}

function updateUser(data) {
  try {
    const sheet = getSheet('users');
    if (!sheet) {
      return buildResponse(false, null, 'Sheet users tidak ditemukan');
    }
    
    if (!checkPermission('super_admin')) {
      return buildResponse(false, null, 'Tidak memiliki akses');
    }
    
    const sheetData = sheet.getDataRange().getValues();
    
    for (let i = 1; i < sheetData.length; i++) {
      if (sheetData[i][0] === data.id) {
        const row = i + 1;
        
        if (data.role) sheet.getRange(row, 4).setValue(data.role);
        if (data.status) sheet.getRange(row, 5).setValue(data.status);
        if (data.department !== undefined) sheet.getRange(row, 6).setValue(data.department);
        
        logAudit('EDIT', 'User Management', sheetData[i][1], 'role', sheetData[i][3], data.role);
        
        return buildResponse(true, null, 'User berhasil diperbarui');
      }
    }
    
    return buildResponse(false, null, 'User tidak ditemukan');
    
  } catch (error) {
    return buildResponse(false, null, error.message);
  }
}

function deleteUser(id) {
  try {
    const sheet = getSheet('users');
    if (!sheet) {
      return buildResponse(false, null, 'Sheet users tidak ditemukan');
    }
    
    if (!checkPermission('super_admin')) {
      return buildResponse(false, null, 'Tidak memiliki akses');
    }
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === id) {
        const email = data[i][1];
        
        // Soft delete
        sheet.getRange(i + 1, 5).setValue('nonaktif');
        
        logAudit('DELETE', 'User Management', email, 'status', 'aktif', 'nonaktif');
        
        return buildResponse(true, null, 'User berhasil dinonaktifkan');
      }
    }
    
    return buildResponse(false, null, 'User tidak ditemukan');
    
  } catch (error) {
    return buildResponse(false, null, error.message);
  }
}

// ============================================================
// ROLES & PERMISSIONS
// ============================================================

function getRoles() {
  try {
    const sheet = getSheet('roles');
    if (!sheet) {
      return buildResponse(false, null, 'Sheet roles tidak ditemukan');
    }
    
    const data = sheet.getDataRange().getValues();
    const roles = [];
    
    for (let i = 1; i < data.length; i++) {
      roles.push({
        id: data[i][0],
        name: data[i][1],
        description: data[i][2],
        level: data[i][3]
      });
    }
    
    return buildResponse(true, { roles: roles });
    
  } catch (error) {
    return buildResponse(false, null, error.message);
  }
}

// ============================================================
// MASTER DATA
// ============================================================

function getMasterData() {
  try {
    const divisions = [];
    const units = [];
    const levels = [];
    
    // Get divisions
    const divSheet = getSheet('master_divisi');
    if (divSheet) {
      const divData = divSheet.getDataRange().getValues();
      for (let i = 1; i < divData.length; i++) {
        divisions.push({
          id: divData[i][0],
          code: divData[i][1],
          name: divData[i][2],
          head: divData[i][3],
          status: divData[i][4]
        });
      }
    }
    
    // Get units
    const unitSheet = getSheet('master_unit');
    if (unitSheet) {
      const unitData = unitSheet.getDataRange().getValues();
      for (let i = 1; i < unitData.length; i++) {
        units.push({
          id: unitData[i][0],
          code: unitData[i][1],
          name: unitData[i][2],
          division: unitData[i][3],
          status: unitData[i][4]
        });
      }
    }
    
    // Get levels
    const levelSheet = getSheet('master_level');
    if (levelSheet) {
      const levelData = levelSheet.getDataRange().getValues();
      for (let i = 1; i < levelData.length; i++) {
        levels.push({
          id: levelData[i][0],
          code: levelData[i][1],
          label: levelData[i][2],
          description: levelData[i][3]
        });
      }
    }
    
    return buildResponse(true, {
      divisions: divisions,
      units: units,
      levels: levels
    });
    
  } catch (error) {
    return buildResponse(false, null, error.message);
  }
}

function updateMasterData(data) {
  try {
    if (!checkPermission('admin_hr')) {
      return buildResponse(false, null, 'Tidak memiliki akses');
    }
    
    if (data.type === 'division') {
      const sheet = getSheet('master_divisi');
      if (sheet) {
        if (data.id) {
          // Update
          const sheetData = sheet.getDataRange().getValues();
          for (let i = 1; i < sheetData.length; i++) {
            if (sheetData[i][0] === data.id) {
              const row = i + 1;
              if (data.code) sheet.getRange(row, 2).setValue(data.code);
              if (data.name) sheet.getRange(row, 3).setValue(data.name);
              if (data.head !== undefined) sheet.getRange(row, 4).setValue(data.head);
              if (data.status) sheet.getRange(row, 5).setValue(data.status);
              return buildResponse(true, null, 'Divisi berhasil diperbarui');
            }
          }
        } else {
          // Add new
          sheet.appendRow([
            generateId(),
            data.code,
            data.name,
            data.head || '',
            data.status || 'aktif'
          ]);
          return buildResponse(true, null, 'Divisi berhasil ditambahkan');
        }
      }
    }
    
    return buildResponse(false, null, 'Tipe master data tidak valid');
    
  } catch (error) {
    return buildResponse(false, null, error.message);
  }
}

// ============================================================
// DASHBOARD CONFIGURATION
// ============================================================

function getDashboardConfig() {
  try {
    const sheet = getSheet('dashboard_config');
    if (!sheet) {
      return buildResponse(true, { config: getDefaultDashboardConfig() });
    }
    
    const data = sheet.getDataRange().getValues();
    const config = [];
    
    for (let i = 1; i < data.length; i++) {
      config.push({
        id: data[i][0],
        widgetCode: data[i][1],
        label: data[i][2],
        isActive: data[i][3],
        sortOrder: data[i][4],
        visibility: data[i][5]
      });
    }
    
    return buildResponse(true, { config: config });
    
  } catch (error) {
    return buildResponse(false, null, error.message);
  }
}

function getDefaultDashboardConfig() {
  return [
    { widgetCode: 'TOTAL_AKTIF', label: 'Total Karyawan Aktif', isActive: true, sortOrder: 1, visibility: 'all' },
    { widgetCode: 'TOTAL_TETAP', label: 'Karyawan Tetap', isActive: true, sortOrder: 2, visibility: 'all' },
    { widgetCode: 'TOTAL_KONTRAK', label: 'Karyawan Kontrak', isActive: true, sortOrder: 3, visibility: 'all' },
    { widgetCode: 'TOTAL_RELAWAN', label: 'Relawan', isActive: true, sortOrder: 4, visibility: 'all' },
    { widgetCode: 'JK_PRIA', label: 'Laki-Laki', isActive: true, sortOrder: 5, visibility: 'all' },
    { widgetCode: 'JK_WANITA', label: 'Perempuan', isActive: true, sortOrder: 6, visibility: 'all' },
    { widgetCode: 'PER_DIVISI', label: 'Per Divisi', isActive: true, sortOrder: 7, visibility: 'all' },
    { widgetCode: 'PER_UNIT', label: 'Per Unit', isActive: true, sortOrder: 8, visibility: 'admin' },
    { widgetCode: 'PER_LEVEL', label: 'Per Level', isActive: true, sortOrder: 9, visibility: 'admin' },
    { widgetCode: 'MASA_KERJA_AVG', label: 'Rata-rata Masa Kerja', isActive: true, sortOrder: 10, visibility: 'admin' },
    { widgetCode: 'KONTRAK_30_HARI', label: 'Kontrak Habis < 30 Hari', isActive: true, sortOrder: 11, visibility: 'admin' },
    { widgetCode: 'JOIN_BULAN_INI', label: 'Masuk Bulan Ini', isActive: true, sortOrder: 12, visibility: 'all' },
    { widgetCode: 'ULTAH_MINGGU_INI', label: 'Ulang Tahun Minggu Ini', isActive: true, sortOrder: 13, visibility: 'all' }
  ];
}

function updateDashboardConfig(data) {
  try {
    if (!checkPermission('super_admin')) {
      return buildResponse(false, null, 'Tidak memiliki akses');
    }
    
    let sheet = getSheet('dashboard_config');
    if (!sheet) {
      const ss = getSpreadsheet();
      sheet = ss.insertSheet('dashboard_config');
      sheet.appendRow(['ID', 'Widget Code', 'Label', 'Active', 'Sort Order', 'Visibility']);
    }
    
    // Clear existing data (keep header)
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.deleteRows(2, lastRow - 1);
    }
    
    // Insert new config
    data.config.forEach(item => {
      sheet.appendRow([
        generateId(),
        item.widgetCode,
        item.label,
        item.isActive,
        item.sortOrder,
        item.visibility
      ]);
    });
    
    return buildResponse(true, null, 'Konfigurasi dashboard berhasil diperbarui');
    
  } catch (error) {
    return buildResponse(false, null, error.message);
  }
}

// ============================================================
// AUDIT LOG
// ============================================================

function getAuditLog(data) {
  try {
    const sheet = getSheet('audit_log');
    if (!sheet) {
      return buildResponse(true, { logs: [] });
    }
    
    if (!checkPermission('admin_hr')) {
      return buildResponse(false, null, 'Tidak memiliki akses');
    }
    
    const sheetData = sheet.getDataRange().getValues();
    const logs = [];
    
    for (let i = 1; i < sheetData.length; i++) {
      logs.push({
        id: sheetData[i][0],
        timestamp: sheetData[i][1],
        user: sheetData[i][2],
        action: sheetData[i][3],
        module: sheetData[i][4],
        employeeId: sheetData[i][5],
        field: sheetData[i][6],
        oldValue: sheetData[i][7],
        newValue: sheetData[i][8],
        details: sheetData[i][9]
      });
    }
    
    // Apply filters
    let filtered = logs;
    
    if (data) {
      if (data.module) {
        filtered = filtered.filter(l => l.module === data.module);
      }
      if (data.user) {
        filtered = filtered.filter(l => l.user === data.user);
      }
      if (data.startDate) {
        filtered = filtered.filter(l => new Date(l.timestamp) >= new Date(data.startDate));
      }
      if (data.endDate) {
        filtered = filtered.filter(l => new Date(l.timestamp) <= new Date(data.endDate));
      }
    }
    
    // Sort by timestamp descending
    filtered.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    return buildResponse(true, { 
      logs: filtered.slice(0, 100),
      total: filtered.length
    });
    
  } catch (error) {
    return buildResponse(false, null, error.message);
  }
}

// ============================================================
// IMPORT DATA
// ============================================================

function importFromSource() {
  try {
    if (!checkPermission('admin_hr')) {
      return buildResponse(false, null, 'Tidak memiliki akses untuk import data');
    }
    
    const sourceSheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName('Sheet1');
    if (!sourceSheet) {
      return buildResponse(false, null, 'Sheet sumber tidak ditemukan');
    }
    
    const sourceData = sourceSheet.getDataRange().getValues();
    const targetSheet = getSheet('pegawai');
    const careerSheet = getSheet('career_history');
    
    if (!targetSheet) {
      return buildResponse(false, null, 'Sheet target tidak ditemukan');
    }
    
    let imported = 0;
    let skipped = 0;
    let errors = [];
    
    for (let i = 1; i < sourceData.length; i++) {
      const row = sourceData[i];
      
      // Skip empty rows or separator rows
      if (!row[1] || row[1].toString().trim() === '' || isNaN(row[1])) {
        skipped++;
        continue;
      }
      
      const employeeId = row[1].toString();
      
      // Check for duplicate
      const existingData = targetSheet.getDataRange().getValues();
      const isDuplicate = existingData.some((existingRow, idx) => 
        idx > 0 && existingRow[1] === employeeId
      );
      
      if (isDuplicate) {
        skipped++;
        continue;
      }
      
      try {
        const id = generateId();
        const now = new Date().toISOString();
        
        // Normalize data
        const joinDate = row[12] ? formatDate(parseDate(row[12])) : '';
        const dateOfBirth = row[10] ? formatDate(parseDate(row[10])) : '';
        
        const newRow = [
          id,
          employeeId,
          row[2] || '', // Full Name
          row[3] || '', // Current Position
          row[4] || '', // Department
          row[5] || '', // Unit
          row[6] || '', // Employment Status
          row[7] || '', // Level
          row[8] || '', // Job Level
          joinDate,
          row[17] || '', // Email
          '',
          row[8] || '', // Phone
          row[9] || '', // Place of Birth
          dateOfBirth,
          row[22] || '', // Gender
          row[23] || '', // Marital Status
          row[19] || '', // NIK
          row[20] || '', // NIK Address
          row[21] || '', // Residential Address
          row[18] || '', // Education
          row[26] || '', // Institution Name
          row[27] || '', // Institution Place
          row[25] || '', // Graduation Date
          true, // isActive
          '',
          '',
          now,
          now,
          'import'
        ];
        
        targetSheet.appendRow(newRow);
        
        // Import career history
        if (careerSheet) {
          importCareerHistory(careerSheet, employeeId, row);
        }
        
        imported++;
        
      } catch (error) {
        errors.push(`Baris ${i + 1}: ${error.message}`);
      }
    }
    
    logAudit('IMPORT', 'Data Pegawai', '', 'batch', '', `${imported} data imported`);
    
    return buildResponse(true, {
      imported: imported,
      skipped: skipped,
      errors: errors
    }, `Import selesai: ${imported} data berhasil, ${skipped} dilewati`);
    
  } catch (error) {
    return buildResponse(false, null, error.message);
  }
}

function importCareerHistory(careerSheet, employeeId, sourceRow) {
  // Parse career history from source columns (AM to BK)
  // Columns 38-63 are career paths (Career Path 1 Date, Career Path 1, etc.)
  
  for (let i = 0; i < 12; i++) {
    const dateCol = 38 + (i * 2); // Career Path X Date
    const jobCol = 39 + (i * 2); // Career Path X
    
    if (sourceRow[jobCol] && sourceRow[jobCol].toString().trim() !== '') {
      const id = generateId();
      const tanggalMulai = sourceRow[dateCol] ? formatDate(parseDate(sourceRow[dateCol])) : '';
      
      careerSheet.appendRow([
        id,
        employeeId,
        i + 1,
        sourceRow[jobCol],
        '',
        '',
        tanggalMulai,
        '',
        '',
        i === 11, // isCurrent if last one
        new Date().toISOString(),
        'import'
      ]);
    }
  }
}

// ============================================================
// EXPORT DATA
// ============================================================

function exportData(data) {
  try {
    const employees = getEmployees(data);
    if (!employees.success) {
      return employees;
    }
    
    // Create temporary spreadsheet for export
    const tempSpreadsheet = SpreadsheetApp.create('Export_SIMDP_' + new Date().toISOString().split('T')[0]);
    const sheet = tempSpreadsheet.getActiveSheet();
    
    // Add headers
    sheet.appendRow([
      'Employee ID', 'Nama Lengkap', 'Posisi', 'Departemen', 'Unit',
      'Status', 'Level', 'Job Level', 'Tanggal Masuk', 'Email',
      'No. HP', 'Jenis Kelamin', 'Status Nikah', 'Masa Kerja'
    ]);
    
    // Add data
    employees.data.employees.forEach(emp => {
      sheet.appendRow([
        emp.employeeId,
        emp.fullName,
        emp.currentPosition,
        emp.department,
        emp.unit,
        emp.employmentStatus,
        emp.level,
        emp.jobLevel,
        emp.joinDate,
        emp.email,
        emp.phone,
        emp.gender === 'L' ? 'Laki-laki' : 'Perempuan',
        emp.maritalStatus,
        emp.workDuration
      ]);
    });
    
    // Auto-fit columns
    sheet.autoResizeColumns(1, 14);
    
    logAudit('EXPORT', 'Data Pegawai', '', 'export', '', `${employees.data.employees.length} data exported`);
    
    return buildResponse(true, {
      url: tempSpreadsheet.getUrl(),
      id: tempSpreadsheet.getId()
    }, 'Export berhasil');
    
  } catch (error) {
    return buildResponse(false, null, error.message);
  }
}

// ============================================================
// NOTIFICATIONS
// ============================================================

function getNotifications() {
  try {
    const notifications = [];
    
    // Check expiring contracts
    const sheet = getSheet('pegawai');
    if (sheet) {
      const data = sheet.getDataRange().getValues();
      const today = new Date();
      
      for (let i = 1; i < data.length; i++) {
        if (data[i][6] === 'Kontrak' && data[i][24] === true) {
          // Check contract end date (if stored)
          // This is a simplified version
          notifications.push({
            type: 'info',
            message: `Kontrak ${data[i][2]} perlu diperiksa`,
            date: new Date().toISOString()
          });
        }
      }
    }
    
    return buildResponse(true, { notifications: notifications });
    
  } catch (error) {
    return buildResponse(false, null, error.message);
  }
}

// ============================================================
// DOCUMENTS (Google Drive Integration)
// ============================================================

function getDocuments(employeeId) {
  try {
    const sheet = getSheet('dokumen_pegawai');
    if (!sheet) {
      return buildResponse(true, { documents: [] });
    }
    
    const data = sheet.getDataRange().getValues();
    const documents = [];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][1] === employeeId) {
        documents.push({
          id: data[i][0],
          employeeId: data[i][1],
          name: data[i][2],
          category: data[i][3],
          fileId: data[i][4],
          url: data[i][5],
          uploadedAt: data[i][6],
          uploadedBy: data[i][7]
        });
      }
    }
    
    return buildResponse(true, { documents: documents });
    
  } catch (error) {
    return buildResponse(false, null, error.message);
  }
}

function uploadDocument(data) {
  try {
    const sheet = getSheet('dokumen_pegawai');
    if (!sheet) {
      const ss = getSpreadsheet();
      const newSheet = ss.insertSheet('dokumen_pegawai');
      newSheet.appendRow(['ID', 'Employee ID', 'Name', 'Category', 'File ID', 'URL', 'Uploaded At', 'Uploaded By']);
    }
    
    const targetSheet = getSheet('dokumen_pegawai');
    const id = generateId();
    
    // Create folder structure in Drive
    const folderName = 'SIMDP';
    let mainFolder = DriveApp.getFoldersByName(folderName).hasNext() 
      ? DriveApp.getFoldersByName(folderName).next() 
      : DriveApp.createFolder(folderName);
    
    const empFolderName = data.employeeId;
    let empFolder = mainFolder.getFoldersByName(empFolderName).hasNext()
      ? mainFolder.getFoldersByName(empFolderName).next()
      : mainFolder.createFolder(empFolderName);
    
    // Note: File upload from client side would need to be handled differently
    // This is a placeholder for the document reference
    
    targetSheet.appendRow([
      id,
      data.employeeId,
      data.name,
      data.category,
      data.fileId || '',
      data.url || '',
      new Date().toISOString(),
      getCurrentUser()
    ]);
    
    return buildResponse(true, { id: id }, 'Dokumen berhasil diupload');
    
  } catch (error) {
    return buildResponse(false, null, error.message);
  }
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function initializeSheets() {
  const ss = getSpreadsheet();
  
  // Create sheets if they don't exist
  const requiredSheets = [
    'pegawai', 'career_history', 'family_members', 'users', 'roles',
    'permissions', 'master_divisi', 'master_unit', 'master_level',
    'dokumen_pegawai', 'audit_log', 'dashboard_config', 'notifikasi_config', 'app_settings'
  ];
  
  requiredSheets.forEach(sheetName => {
    if (!ss.getSheetByName(sheetName)) {
      ss.insertSheet(sheetName);
    }
  });
  
  // Add headers for pegawai sheet
  const pegawaiSheet = ss.getSheetByName('pegawai');
  if (pegawaiSheet.getLastRow() === 0) {
    pegawaiSheet.appendRow([
      'ID', 'Employee ID', 'Full Name', 'Current Position', 'Department', 'Unit',
      'Employment Status', 'Level', 'Job Level', 'Join Date', 'Email Kantor',
      'Email Pribadi', 'Mobile Phone', 'Place of Birth', 'Date of Birth',
      'Gender', 'Marital Status', 'NIK', 'NIK Address', 'Residential Address',
      'Education Level', 'Institution Name', 'Institution Place', 'Graduation Date',
      'Is Active', 'Inactive Date', 'Inactive Reason', 'Created At', 'Updated At', 'Updated By'
    ]);
  }
  
  // Add headers for career_history sheet
  const careerSheet = ss.getSheetByName('career_history');
  if (careerSheet.getLastRow() === 0) {
    careerSheet.appendRow([
      'ID', 'Employee ID', 'Urutan', 'Jabatan', 'Department', 'Unit',
      'Tanggal Mulai', 'Tanggal Selesai', 'Keterangan', 'Is Current',
      'Created At', 'Updated By'
    ]);
  }
  
  // Add headers for family_members sheet
  const familySheet = ss.getSheetByName('family_members');
  if (familySheet.getLastRow() === 0) {
    familySheet.appendRow([
      'ID', 'Employee ID', 'Tipe', 'Nama', 'Tanggal Lahir', 'Urutan Anak'
    ]);
  }
  
  // Add headers for users sheet
  const usersSheet = ss.getSheetByName('users');
  if (usersSheet.getLastRow() === 0) {
    usersSheet.appendRow([
      'ID', 'Email', 'Name', 'Role', 'Status', 'Department', 'Last Login'
    ]);
  }
  
  // Add default roles
  const rolesSheet = ss.getSheetByName('roles');
  if (rolesSheet.getLastRow() === 0) {
    rolesSheet.appendRow(['ID', 'Name', 'Description', 'Level']);
    rolesSheet.appendRow([generateId(), 'super_admin', 'Super Admin - Akses penuh', 4]);
    rolesSheet.appendRow([generateId(), 'admin_hr', 'Admin HR - Kelola data karyawan', 3]);
    rolesSheet.appendRow([generateId(), 'manager_divisi', 'Manager Divisi - Lihat data divisi', 2]);
    rolesSheet.appendRow([generateId(), 'staf_viewer', 'Staf Viewer - Lihat data terbatas', 1]);
  }
  
  // Add default master data
  const divSheet = ss.getSheetByName('master_divisi');
  if (divSheet.getLastRow() === 0) {
    divSheet.appendRow(['ID', 'Code', 'Name', 'Head', 'Status']);
    divSheet.appendRow([generateId(), 'SEK', 'Sekretariat', '', 'aktif']);
    divSheet.appendRow([generateId(), 'KEU', 'Keuangan', '', 'aktif']);
    divSheet.appendRow([generateId(), 'LAZ', 'LAZ Al Azhar', '', 'aktif']);
    divSheet.appendRow([generateId(), 'FUN', 'Fundraising & Partnership', '', 'aktif']);
    divSheet.appendRow([generateId(), 'PRO', 'Program', '', 'aktif']);
  }
  
  return buildResponse(true, null, 'Sheet berhasil diinisialisasi');
}

function testFunction() {
  Logger.log('SIMDP Test Function');
  Logger.log('Current user: ' + getCurrentUser());
  return 'OK';
}
