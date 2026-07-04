import { 
    collection, 
    query, 
    where, 
    getDocs, 
    doc, 
    getDoc, 
    setDoc, 
    addDoc, 
    updateDoc, 
    limit,
    orderBy 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import bcrypt from "bcryptjs";

// Helper to convert Firestore doc to standard object containing both id and _id
function docToObj(docSnap: any) {
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    return {
        id: docSnap.id,
        _id: docSnap.id,
        ...data,
        // Convert any timestamps or serializable nested data if necessary
    };
}

// ── USER SERVICES ────────────────────────────────────────────────────────────

export async function getUserByEmail(email: string) {
    if (!email) return null;
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("email", "==", email.trim()), limit(1));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    return docToObj(querySnapshot.docs[0]);
}

export async function getUserByEmailOrEmployeeId(identifier: string) {
    if (!identifier) return null;
    const cleanIdentifier = identifier.trim();
    
    // Check by email
    const emailUser = await getUserByEmail(cleanIdentifier);
    if (emailUser) return emailUser;

    // Check by employeeId
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("employeeId", "==", cleanIdentifier.toUpperCase()), limit(1));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    return docToObj(querySnapshot.docs[0]);
}

export async function getUserById(id: string) {
    if (!id) return null;
    const docRef = doc(db, "users", id);
    const docSnap = await getDoc(docRef);
    return docToObj(docSnap);
}

export async function createUser(data: any) {
    const usersRef = collection(db, "users");
    const defaultData = {
        role: "employee",
        status: "active",
        gender: "male",
        bio: "",
        skills: [],
        importantPoints: [],
        isAddressUpdated: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    
    // If specific ID is not provided, Firestore auto-generates one.
    const finalData = { ...defaultData, ...data };
    const docRef = await addDoc(usersRef, finalData);
    const docSnap = await getDoc(docRef);
    return docToObj(docSnap);
}

export async function updateUser(id: string, data: any) {
    if (!id) throw new Error("User ID is required for update");
    const docRef = doc(db, "users", id);
    await updateDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString(),
    });
    const docSnap = await getDoc(docRef);
    return docToObj(docSnap);
}

// ── PASSWORD SERVICES ────────────────────────────────────────────────────────

export async function hashPassword(password: string) {
    const salt = await bcrypt.genSalt(7);
    return await bcrypt.hash(password, salt);
}

export async function verifyPassword(password: string, hash: string) {
    return await bcrypt.compare(password, hash);
}

// ── ORGANIZATION SERVICES ───────────────────────────────────────────────────

export async function getOrganizationById(id: string) {
    if (!id) return null;
    const docRef = doc(db, "organizations", id);
    const docSnap = await getDoc(docRef);
    return docToObj(docSnap);
}

export async function getOrganizationsList() {
    const orgsRef = collection(db, "organizations");
    const querySnapshot = await getDocs(orgsRef);
    return querySnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        _id: docSnap.id,
        name: docSnap.data().name,
    }));
}

export async function getOrganizationByCreatedBy(userId: string) {
    if (!userId) return null;
    const orgsRef = collection(db, "organizations");
    const q = query(orgsRef, where("createdBy", "==", userId), limit(1));
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    return docToObj(querySnapshot.docs[0]);
}

export async function createOrganization(data: any) {
    const orgsRef = collection(db, "organizations");
    const defaultData = {
        logo: "",
        address: "",
        additionalInfo: {},
        checkInStart: "09:00",
        checkInEnd: "11:00",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    const finalData = { ...defaultData, ...data };
    const docRef = await addDoc(orgsRef, finalData);
    const docSnap = await getDoc(docRef);
    return docToObj(docSnap);
}

export async function updateOrganization(id: string, data: any) {
    if (!id) throw new Error("Organization ID is required for update");
    const docRef = doc(db, "organizations", id);
    await updateDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString(),
    });
    const docSnap = await getDoc(docRef);
    return docToObj(docSnap);
}

// ── SALARY SERVICES ──────────────────────────────────────────────────────────

export async function getSalaryByUserIdAndOrgId(userId: string, organizationId: string) {
    if (!userId || !organizationId) return null;
    const salariesRef = collection(db, "salaries");
    const q = query(
        salariesRef, 
        where("userId", "==", userId), 
        where("organizationId", "==", organizationId), 
        limit(1)
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    return docToObj(querySnapshot.docs[0]);
}

export async function upsertSalary(userId: string, organizationId: string, salaryData: any) {
    if (!userId || !organizationId) throw new Error("User ID and Organization ID are required");
    const salariesRef = collection(db, "salaries");
    const q = query(
        salariesRef, 
        where("userId", "==", userId), 
        where("organizationId", "==", organizationId), 
        limit(1)
    );
    const querySnapshot = await getDocs(q);
    
    const finalData = {
        userId,
        organizationId,
        basic: Number(salaryData.basic),
        hra: Number(salaryData.hra) || 0,
        da: Number(salaryData.da) || 0,
        bonus: Number(salaryData.bonus) || 0,
        otherAllowances: Number(salaryData.otherAllowances) || 0,
        pf: Number(salaryData.pf) || 0,
        tax: Number(salaryData.tax) || 0,
        otherDeductions: Number(salaryData.otherDeductions) || 0,
        updatedAt: new Date().toISOString(),
    };

    if (querySnapshot.empty) {
        // Create new
        const docRef = await addDoc(salariesRef, {
            ...finalData,
            createdAt: new Date().toISOString(),
        });
        const docSnap = await getDoc(docRef);
        return docToObj(docSnap);
    } else {
        // Update existing
        const docId = querySnapshot.docs[0].id;
        const docRef = doc(db, "salaries", docId);
        await updateDoc(docRef, finalData);
        const docSnap = await getDoc(docRef);
        return docToObj(docSnap);
    }
}

// ── ATTENDANCE SERVICES ──────────────────────────────────────────────────────

export async function getAttendanceByUserAndDate(userId: string, date: string) {
    if (!userId || !date) return null;
    const attendanceRef = collection(db, "attendances");
    const q = query(
        attendanceRef, 
        where("userId", "==", userId), 
        where("date", "==", date), 
        limit(1)
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    return docToObj(querySnapshot.docs[0]);
}

export async function getAttendanceByUserAndMonth(userId: string, monthPrefix: string) {
    if (!userId || !monthPrefix) return [];
    const attendanceRef = collection(db, "attendances");
    // Firestore prefix matching using standard string bounds
    const q = query(
        attendanceRef,
        where("userId", "==", userId),
        where("date", ">=", monthPrefix),
        where("date", "<=", monthPrefix + "\uf8ff")
    );
    const querySnapshot = await getDocs(q);
    const records = querySnapshot.docs.map(docSnap => docToObj(docSnap));
    // Sort in ascending order by date
    records.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    return records;
}

export async function createAttendance(data: any) {
    const attendanceRef = collection(db, "attendances");
    const defaultData = {
        status: "present",
        workingHours: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };
    const finalData = { ...defaultData, ...data };
    const docRef = await addDoc(attendanceRef, finalData);
    const docSnap = await getDoc(docRef);
    return docToObj(docSnap);
}

export async function updateAttendance(id: string, data: any) {
    if (!id) throw new Error("Attendance ID is required for update");
    const docRef = doc(db, "attendances", id);
    await updateDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString(),
    });
    const docSnap = await getDoc(docRef);
    return docToObj(docSnap);
}

// Additional helpers needed by API routes

export async function getEmployeesByOrganization(organizationId: string) {
    if (!organizationId) return [];
    const usersRef = collection(db, "users");
    const q = query(
        usersRef,
        where("organizationId", "==", organizationId),
        where("role", "==", "employee")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(docSnap => docToObj(docSnap));
}

export async function getAttendanceByUserId(userId: string) {
    if (!userId) return [];
    const attendanceRef = collection(db, "attendances");
    const q = query(
        attendanceRef,
        where("userId", "==", userId)
    );
    const querySnapshot = await getDocs(q);
    const records = querySnapshot.docs.map(docSnap => docToObj(docSnap));
    records.sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    return records;
}
