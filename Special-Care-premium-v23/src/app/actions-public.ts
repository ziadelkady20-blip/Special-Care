"use server";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { cases, followUps, notes, medicalReports, users, roles, centers, parents, parentChildren, childCenters } from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { getCurrentAppUser } from "@/lib/session";
import { createCase as createCaseAction, updateCase as updateCaseAction } from "./actions";

async function session() {
  const user = await getCurrentAppUser();
  if (!user) throw new Error("الجلسة غير صالحة");
  return user;
}

// Keep the public action facade limited to explicit async exports. This avoids
// re-exporting non-action values from the large internal actions module, which
// Next.js/Turbopack rejects in a "use server" module.
export async function createCase(input: unknown) {
  return createCaseAction(input);
}

export async function updateCase(input: unknown) {
  return updateCaseAction(input);
}

export async function createFollowUp(input: any) {
  const user = await session(); const x = input ?? {};
  const [row] = await db.insert(followUps).values({ caseId:x.caseId, specialistId:x.specialistId ?? user.id, caseServiceId:x.caseServiceId ?? null, followUpDate:x.followUpDate ?? new Date().toISOString().slice(0,10), progress:x.progress ?? "STABLE", observations:x.observations ?? null, recommendations:x.recommendations ?? null, nextFollowUpDate:x.nextFollowUpDate ?? null }).returning();
  return { ok:true, id:row.id };
}
export async function addNote(input:any) {
  const user=await session(); const x=input??{};
  const [row]=await db.insert(notes).values({caseId:x.caseId,userId:user.id,content:String(x.content??x.note??"").trim()}).returning();
  return {ok:true,id:row.id};
}
export async function createMedicalReport(input:any) {
  const user=await session(); const x=input??{};
  const [row]=await db.insert(medicalReports).values({caseId:x.caseId,reportType:x.reportType??"MEDICAL",reportDate:x.reportDate??new Date().toISOString().slice(0,10),issuedBy:x.issuedBy??null,description:x.description??null,fileUrl:x.fileUrl??null,uploadedBy:user.id}).returning();
  return {ok:true,id:row.id};
}
export async function updateCaseStatus(input:any, maybeStatus?:any) {
  const user=await session(); const caseId=typeof input==="string"?input:input?.caseId; const status=typeof input==="string"?maybeStatus:input?.status;
  const [row]=await db.update(cases).set({status,updatedAt:new Date()}).where(and(eq(cases.id,caseId),eq(cases.centerId,user.centerId))).returning();
  return row?{ok:true}:{ok:false,error:"الحالة غير موجودة"};
}
export async function changeOwnPassword(input:any, maybePassword?:any) {
  const user=await session(); const password=typeof input==="string"?maybePassword:input?.newPassword??input?.password;
  if(!password||String(password).length<8)return{ok:false,error:"كلمة المرور يجب ألا تقل عن 8 أحرف"};
  await db.update(users).set({passwordHash:await hashPassword(String(password)),updatedAt:new Date()}).where(eq(users.id,user.id)); return{ok:true};
}
async function roleId(name:string){const [r]=await db.select({id:roles.id}).from(roles).where(eq(roles.name,name as any)).limit(1);return r?.id;}
export async function createUser(input:any){const actor=await session();const x=input??{};const rid=x.roleId??await roleId(x.role??"SPECIALIST");if(!rid)return{ok:false,error:"الدور غير موجود"};const [row]=await db.insert(users).values({centerId:x.centerId??actor.centerId,name:x.name,email:x.email,phone:x.phone??null,roleId:rid,passwordHash:await hashPassword(String(x.password??"ChangeMe123!")),status:x.status??"ACTIVE"}).returning({id:users.id});return{ok:true,id:row.id};}
export async function toggleUserStatus(input:any, maybeStatus?:any){const actor=await session();const id=typeof input==="string"?input:input?.userId??input?.id;const status=typeof input==="string"?maybeStatus:input?.status;const [row]=await db.update(users).set({status:status??"DISABLED",updatedAt:new Date()}).where(and(eq(users.id,id),eq(users.centerId,actor.centerId))).returning({id:users.id});return row?{ok:true}:{ok:false,error:"المستخدم غير موجود"};}
export async function updateUser(input:any){const actor=await session();const x=input??{};const values:any={name:x.name,email:x.email,phone:x.phone??null,updatedAt:new Date()};if(x.roleId)values.roleId=x.roleId;if(x.password)values.passwordHash=await hashPassword(String(x.password));const [row]=await db.update(users).set(values).where(and(eq(users.id,x.userId??x.id),eq(users.centerId,actor.centerId))).returning({id:users.id});return row?{ok:true}:{ok:false,error:"المستخدم غير موجود"};}
export async function createCenter(input:any){await session();const x=input??{};const [row]=await db.insert(centers).values({name:x.name,slug:x.slug??String(x.name??"center").toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/g,"-").replace(/^-|-$/g,""),phone:x.phone??null,email:x.email??null,address:x.address??null,description:x.description??null,status:x.status??"ACTIVE"}).returning({id:centers.id});return{ok:true,id:row.id};}
export async function joinCenter(input:any){const x=input??{};if(!x.childId||!x.centerId)return{ok:false,error:"بيانات الانضمام ناقصة"};await db.insert(childCenters).values({childId:x.childId,centerId:x.centerId,status:"PENDING"}).onConflictDoNothing();return{ok:true};}
export async function createParentChild(input:any){const x=input??{};if(!x.parentId||!x.childId)return{ok:false,error:"بيانات الربط ناقصة"};const [row]=await db.insert(parentChildren).values({parentId:x.parentId,childId:x.childId,relationship:x.relationship??"PARENT",isPrimary:x.isPrimary??true}).returning({id:parentChildren.id});return{ok:true,id:row.id};}
export async function registerParent(input:any){const x=input??{};if(!x.email||!x.password||!x.name)return{ok:false,error:"الاسم والبريد وكلمة المرور مطلوبة"};const [parent]=await db.insert(parents).values({name:x.name,email:x.email,phone:x.phone??null,passwordHash:await hashPassword(String(x.password)),status:"ACTIVE"}).returning({id:parents.id});if(x.childId)await db.insert(parentChildren).values({parentId:parent.id,childId:x.childId,relationship:x.relationship??"PARENT",isPrimary:true});return{ok:true,id:parent.id};}
