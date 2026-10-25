import type { Trip } from '../trip/trip';
import { getEntryRegulation } from './entryRegulations';
export type VisaRequirement={type:'none'|'eta'|'esta'|'visa';label:string;summary:string;points:string[];officialLinks:{label:string;url:string}[];sourceIds:string[]};
const none:VisaRequirement={type:'none',label:'단기 관광 기본 안내 대상 아님',summary:'',points:[],officialLinks:[],sourceIds:[]};
// Visibility of this guide is not an individual visa eligibility decision.
export const visaRequirements:Record<string,VisaRequirement>={
  JP:{...none},VN:{...none},TH:{...none},TW:{...none},
  US:{type:'esta',label:'ESTA 확인',summary:'한국 일반여권으로 비자면제프로그램을 이용해 단기 관광한다면 출발 전 ESTA 승인을 확인하세요.',
    points:['ESTA는 비자가 아닌 전자여행허가예요. VWP 관광은 최대90일이며 개인별 자격·예외를 확인하세요.','여행 목적에 맞는 유효한 미국 비자를 사용한다면 ESTA가 필요하지 않을 수 있어요.','ESTA 승인이 최종 입국을 보장하지 않아요. 공식 사이트에서 신청·승인 상태와 수수료를 확인하세요.'],
    officialLinks:[{label:'공식 ESTA 신청 · 승인 상태 확인',url:'https://esta.cbp.dhs.gov/'},{label:'미국 국무부 · VWP 자격·예외',url:'https://travel.state.gov/content/travel/en/us-visas/tourism-visit/visa-waiver-program.html'}],sourceIds:['entry-us-vwp-current','entry-us-esta','entry-us-esta-definition']},
  AU:{type:'eta',label:'ETA 확인',summary:'한국 일반여권으로 단기 관광한다면 출발 전 ETA 등 적합한 비자 승인 여부를 확인하세요.',
    points:['ETA는 전자여행허가 방식의 비자(subclass 601)예요. 한국 여권의 관광 신청 안내는 방문당 최대3개월 범위예요.','유효한 다른 호주 비자를 보유했다면 해당 비자의 조건을 확인하세요. 개인별 자격·목적에 따라 다른 비자가 필요할 수 있어요.','공식 Australian ETA App에서 신청·승인 결과를 확인하세요. 신청 서비스 수수료가 발생할 수 있으며 승인이 최종 입국을 보장하지 않아요.'],
    officialLinks:[{label:'호주 내무부 · ETA(subclass601)',url:'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/electronic-travel-authority-601'},{label:'주한 호주대사관 · ETA App 안내',url:'https://southkorea.embassy.gov.au/seol/ETA601.html'}],sourceIds:['entry-au-eta-korea','entry-au-eta-601']},
};
export function getVisaRequirement(trip:Trip){const requirement=Object.prototype.hasOwnProperty.call(visaRequirements,trip.countryId)?visaRequirements[trip.countryId]:null;return requirement?{...requirement,needsReview:Boolean(getEntryRegulation(trip)?.outOfScope)}:null;}
