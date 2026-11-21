using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TravelSaas.Api.Migrations
{
    /// <inheritdoc />
    public partial class EnhanceTripAndCustomFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CustomFieldsJson",
                table: "Trips",
                type: "jsonb",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "Age",
                table: "TripMembers",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "CustomFieldsJson",
                table: "TripMembers",
                type: "jsonb",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "Gender",
                table: "TripMembers",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ActivityType",
                table: "TripItinerarySchedules",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "AssignedPersonResource",
                table: "TripItinerarySchedules",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DayId",
                table: "TripItinerarySchedules",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "TripItinerarySchedules",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Destination",
                table: "TripItinerarySchedules",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Notes",
                table: "TripItinerarySchedules",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Origin",
                table: "TripItinerarySchedules",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "TripItinerarySchedules",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "CreatedAt",
                table: "CustomFieldDefinitions",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "DefaultValue",
                table: "CustomFieldDefinitions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsArchived",
                table: "CustomFieldDefinitions",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "SortOrder",
                table: "CustomFieldDefinitions",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "CustomFieldDefinitions",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "ValidationRulesJson",
                table: "CustomFieldDefinitions",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "TripItineraryDays",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    TripId = table.Column<Guid>(type: "uuid", nullable: false),
                    DayNumber = table.Column<int>(type: "integer", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    DayDate = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TripItineraryDays", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TripItineraryDays_Trips_TripId",
                        column: x => x.TripId,
                        principalTable: "Trips",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TripItinerarySchedules_DayId",
                table: "TripItinerarySchedules",
                column: "DayId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomFieldDefinitions_TenantId_TargetEntity_FieldKey",
                table: "CustomFieldDefinitions",
                columns: new[] { "TenantId", "TargetEntity", "FieldKey" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_TripItineraryDays_TripId",
                table: "TripItineraryDays",
                column: "TripId");

            migrationBuilder.AddForeignKey(
                name: "FK_TripItinerarySchedules_TripItineraryDays_DayId",
                table: "TripItinerarySchedules",
                column: "DayId",
                principalTable: "TripItineraryDays",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TripItinerarySchedules_TripItineraryDays_DayId",
                table: "TripItinerarySchedules");

            migrationBuilder.DropTable(
                name: "TripItineraryDays");

            migrationBuilder.DropIndex(
                name: "IX_TripItinerarySchedules_DayId",
                table: "TripItinerarySchedules");

            migrationBuilder.DropIndex(
                name: "IX_CustomFieldDefinitions_TenantId_TargetEntity_FieldKey",
                table: "CustomFieldDefinitions");

            migrationBuilder.DropColumn(
                name: "CustomFieldsJson",
                table: "Trips");

            migrationBuilder.DropColumn(
                name: "Age",
                table: "TripMembers");

            migrationBuilder.DropColumn(
                name: "CustomFieldsJson",
                table: "TripMembers");

            migrationBuilder.DropColumn(
                name: "Gender",
                table: "TripMembers");

            migrationBuilder.DropColumn(
                name: "ActivityType",
                table: "TripItinerarySchedules");

            migrationBuilder.DropColumn(
                name: "AssignedPersonResource",
                table: "TripItinerarySchedules");

            migrationBuilder.DropColumn(
                name: "DayId",
                table: "TripItinerarySchedules");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "TripItinerarySchedules");

            migrationBuilder.DropColumn(
                name: "Destination",
                table: "TripItinerarySchedules");

            migrationBuilder.DropColumn(
                name: "Notes",
                table: "TripItinerarySchedules");

            migrationBuilder.DropColumn(
                name: "Origin",
                table: "TripItinerarySchedules");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "TripItinerarySchedules");

            migrationBuilder.DropColumn(
                name: "CreatedAt",
                table: "CustomFieldDefinitions");

            migrationBuilder.DropColumn(
                name: "DefaultValue",
                table: "CustomFieldDefinitions");

            migrationBuilder.DropColumn(
                name: "IsArchived",
                table: "CustomFieldDefinitions");

            migrationBuilder.DropColumn(
                name: "SortOrder",
                table: "CustomFieldDefinitions");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "CustomFieldDefinitions");

            migrationBuilder.DropColumn(
                name: "ValidationRulesJson",
                table: "CustomFieldDefinitions");
        }
    }
}
