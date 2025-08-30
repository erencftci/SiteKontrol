using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddParcelAndAnnouncementColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ApartmentNumber",
                table: "Parcels",
                type: "TEXT",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "BlogNumber",
                table: "Parcels",
                type: "TEXT",
                maxLength: 10,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ResidentId",
                table: "Parcels",
                type: "INTEGER",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TargetBlogNumber",
                table: "Announcements",
                type: "TEXT",
                maxLength: 10,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ApartmentNumber",
                table: "Parcels");

            migrationBuilder.DropColumn(
                name: "BlogNumber",
                table: "Parcels");

            migrationBuilder.DropColumn(
                name: "ResidentId",
                table: "Parcels");

            migrationBuilder.DropColumn(
                name: "TargetBlogNumber",
                table: "Announcements");
        }
    }
}
