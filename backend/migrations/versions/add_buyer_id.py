"""add buyer_id to listings table

Revision ID: add_buyer_id
Revises: 
Create Date: 2024-04-16 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_buyer_id'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Add buyer_id column to listings table
    op.add_column('listings', sa.Column('buyer_id', sa.Integer(), nullable=True))
    # Add foreign key constraint
    op.create_foreign_key(
        'fk_listings_buyer_id',
        'listings', 'users',
        ['buyer_id'], ['id']
    )


def downgrade():
    # Remove foreign key constraint
    op.drop_constraint('fk_listings_buyer_id', 'listings', type_='foreignkey')
    # Remove buyer_id column
    op.drop_column('listings', 'buyer_id') 