using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class Caretaker_TasksAndAssignments : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CaretakerAssignments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    CaretakerId = table.Column<int>(type: "INTEGER", nullable: false),
                    BlogNumber = table.Column<string>(type: "TEXT", maxLength: 10, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CaretakerAssignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CaretakerAssignments_Users_CaretakerId",
                        column: x => x.CaretakerId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DailyTasks",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    CaretakerId = table.Column<int>(type: "INTEGER", nullable: false),
                    TaskDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    TaskType = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    BlogNumber = table.Column<string>(type: "TEXT", maxLength: 10, nullable: false),
                    IsDone = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DailyTasks", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DailyTasks_Users_CaretakerId",
                        column: x => x.CaretakerId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MonthlyRequirements",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Title = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true),
                    BlogNumber = table.Column<string>(type: "TEXT", maxLength: 10, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MonthlyRequirements", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "MonthlyCompletions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    RequirementId = table.Column<int>(type: "INTEGER", nullable: false),
                    CaretakerId = table.Column<int>(type: "INTEGER", nullable: false),
                    CompletedAt = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MonthlyCompletions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MonthlyCompletions_MonthlyRequirements_RequirementId",
                        column: x => x.RequirementId,
                        principalTable: "MonthlyRequirements",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_MonthlyCompletions_Users_CaretakerId",
                        column: x => x.CaretakerId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CaretakerAssignments_CaretakerId",
                table: "CaretakerAssignments",
                column: "CaretakerId");

            migrationBuilder.CreateIndex(
                name: "IX_DailyTasks_CaretakerId",
                table: "DailyTasks",
                column: "CaretakerId");

            migrationBuilder.CreateIndex(
                name: "IX_MonthlyCompletions_CaretakerId",
                table: "MonthlyCompletions",
                column: "CaretakerId");

            migrationBuilder.CreateIndex(
                name: "IX_MonthlyCompletions_RequirementId",
                table: "MonthlyCompletions",
                column: "RequirementId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CaretakerAssignments");

            migrationBuilder.DropTable(
                name: "DailyTasks");

            migrationBuilder.DropTable(
                name: "MonthlyCompletions");

            migrationBuilder.DropTable(
                name: "MonthlyRequirements");
        }
    }
}
