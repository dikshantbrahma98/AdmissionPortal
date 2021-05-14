import { Component, OnInit, ViewChild } from '@angular/core';
import { UpdateDialogComponent } from '../update-dialog/update-dialog.component';

import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { SubjectService } from '../subject.service';
import * as XLSX from 'xlsx';
// import { debugger } from 'fusioncharts';
// const XLSX = require('xlsx');
// import {SubjectClass} from "../models/SubjectClass.model";
// import {Batch} from "../data";
export interface PeriodicElement {
  name: string;
  position: number;
  weight: number;
  symbol: string;
}
export interface Batch {
  Batch_ID: string;
  Batch_Name: string;
  Academic_Year: Array<any>;
  Regulation_ID: string;
}
export interface Regulation {
  Regulation_ID: string;
  Regulation_Name: string;
  Academic_Year: Array<any>;
}
export interface Department {
  Department_Name: string;
  Department_ID: string;
}
export interface Subject {
  Subject_ID: string;
  Subject_Name: string;
  isActive: boolean;
  Type: string;
  Department_ID: string;
  Regulation_ID: string;
  Credit: string;
}

@Component({
  selector: 'app-subject',
  templateUrl: './subject.component.html',
  styleUrls: ['./subject.component.css']
})
export class SubjectComponent implements OnInit {
  Regulations: Regulation[] = [];
  Departments: Department[] = [];
  Subjects: Subject[] = [];
  dataSource = this.Subjects;
  newTablelist: Subject[] = [];
  dummy = this.Subjects;
  SubSearchKey: any;
  arrayBuffer: any;
  DeptSearchKey: string;
  RegulationSearchKey:string;
  subjectInstance: Subject = {
    Subject_ID: "",
    Subject_Name: "",
    isActive: false,
    Type: "",
    Department_ID: "",
    Regulation_ID: "",
    Credit: "",
  };
  displayedColumns: string[] = ['Subject_ID', 'Subject_Name', 'Type', 'Credit', 'active', 'actions'];
  @ViewChild(MatTable)
  table!: MatTable<any>;
  constructor(public dialog: MatDialog, private SubjectService: SubjectService) { }
  ngOnInit(): void {
    this.fetchRegulation();
    // this.fetchDepartment();
    this.fetchSubjectlist();
  }
  fetchRegulation() {
    this.SubjectService.getRegulation().
      subscribe((data: any) => {
        this.Regulations = data.data;
        this.RegulationSearchKey = this.Regulations[0].Regulation_Name;
        this.fetchDepartmentByRegId(this.RegulationSearchKey);
      });
  }
  fetchDepartment() {
    this.SubjectService.getDepartment().
      subscribe((data: any) => {
        console.log(data);
        // this.Departments = data.data;
        // this.DeptSearchKey=this.Departments[0].Department_Name;
      });
  }
  fetchDepartmentByRegId(ID){
    this.SubjectService.getDepartmentByRegId(ID).subscribe((data: any) => {
      this.Departments = data.data.Department_Details;
      this.DeptSearchKey=this.Departments[0].Department_Name;
    });
  }
  fetchSubjectlist() {
    this.SubjectService.getSubjectList().
      subscribe((data: any) => {
        this.Subjects = data.data;
        this.dataSource = data.data;
        console.log(this.Subjects);
      });
  }
  onAddNewSubject() {
    const dialogRef = this.dialog.open(UpdateDialogComponent,{data: {type:"Create",data:{
      Subject_ID: "",
      Subject_Name: "",
      isActive: false,
      Type: "",
      Department_ID: this.DeptSearchKey,
      Regulation_ID: this.RegulationSearchKey,
      Credit: "",
    }} });
    dialogRef.afterClosed().subscribe((result) => {
      for(var i=0;i<this.Departments.length;i++){
        if(result.data.Department_ID ==this.Departments[i].Department_Name)
        result.data.Department_ID=this.Departments[i].Department_ID;
        break;
      }
      this.SubjectService.createSubject(result.data).subscribe((data: any) => {
        console.log(data.data.msg);
        this.fetchSubjectlist();
        this.table.renderRows();
      });

    });
  }
  onEditSubject(rowData: any) {
    console.log(rowData);
    const dialogRef = this.dialog.open(UpdateDialogComponent, { data: rowData });
    dialogRef.afterClosed().subscribe((result) => {
      if (result.edited) {
        this.SubjectService.updateSubject(result.data.Subject_ID, result.data).subscribe((data: any) => {
          console.log(data.data.msg);
          this.fetchSubjectlist();
          this.table.renderRows();
        });
      }

    });
  }
  SubSearch() {
    if (this.SubSearchKey == "") {
      this.ngOnInit();
    }
    else {
      this.dataSource = this.Subjects.filter(res => {
        // const array =[];
        // const SubName = res.Subject_Name.toLocaleLowerCase().match(this.SubSearchKey.toLocaleLowerCase());
        // const SubCode = res.Subject_ID.toLocaleLowerCase().match(this.SubSearchKey.toLocaleLowerCase());
        // const subType = res.Type.toLocaleLowerCase().match(this.SubSearchKey.toLocaleLowerCase());
        // array.push(SubName);
        // array.push(SubCode);
        // array.push(subType);
        // return array;
        return res.Subject_Name.toLocaleLowerCase().match(this.SubSearchKey.toLocaleLowerCase());
      });
    }
  }
  key = "Subject_Name";
  reverse: boolean = false;
  SubSort(Subject_Name: any) {
    this.key = Subject_Name;
    this.reverse = !this.reverse;
  }
  DeptSearch(oEvent) {
    console.log(oEvent.value);
    this.DeptSearchKey=oEvent.value;
  }
  RegulationSearch(oEvent){
    console.log(oEvent.value);
    this.RegulationSearchKey=oEvent.value;
    this.fetchDepartmentByRegId(this.RegulationSearchKey);
  }
  onFileUpload(oEvent) {
    var file = oEvent.target.files[0];
    let fileReader = new FileReader();
    fileReader.readAsArrayBuffer(file);
    fileReader.onload = (e) => {
      this.arrayBuffer = fileReader.result;
      var data = new Uint8Array(this.arrayBuffer);
      var arr = new Array();
      for (var i = 0; i != data.length; ++i) arr[i] = String.fromCharCode(data[i]);
      var bstr = arr.join("");
      var workbook = XLSX.read(bstr, { type: "binary" });
      var first_sheet_name = workbook.SheetNames[0];
      var worksheet = workbook.Sheets[first_sheet_name];
      this.newTablelist = XLSX.utils.sheet_to_json(worksheet, { raw: true });
      // var filelist =[];    
      // filelist=newTablelist;
      console.log(this.newTablelist)
      var j, crctArray = [], errArray = [], flag = 0;
      for (var i = 0; i < this.newTablelist.length; i++, flag = 0) {
        for (j = 0; j < this.dataSource.length; j++) {
          if (this.newTablelist[i].Subject_ID === this.dataSource[j].Subject_ID) {
            flag = 1;
          }
        }
        if (flag) {
          errArray.push(this.newTablelist[i]);
        }
        else {
          crctArray.push(this.newTablelist[i]);
          this.SubjectService.createSubjectBulkUpload(crctArray).subscribe((data:any)=>{
       console.log(data.data.msg);
       this.fetchSubjectlist();
     this.table.renderRows();
     },
     (err) => {console.log(err)});
        }
      }
      console.log(crctArray);
      console.log(errArray);
      if (errArray.length) {
        var ws = XLSX.utils.json_to_sheet(errArray);
        var wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Error");
        XLSX.writeFile(wb, "sheetjs.xlsx");
      }
      // this.dataSource=this.dataSource.concat(filelist);

    }

    // this.table.renderRows();
  }
}
